from flame.star import StarModel, StarAnalyzer, StarAggregator
from Crypto.Random import get_random_bytes
from itertools import combinations

import csv
import os
import subprocess
import tempfile
import requests
import time
import pickle
import signal
import pwd
import io
import tomllib
import tomli_w

class RLAnalyzer(StarAnalyzer):
    def __init__(self, flame):
        """
        Initializes the custom Analyzer node.

        :param flame: Instance of FlameCoreSDK to interact with the FLAME components.
        """
        flame.flame_log("Init of analyzer started ...")

        super().__init__(flame)  # Connects this analyzer to the FLAME components
        self.result = None
    
        flame.flame_log("Init of analyzer finished ...")
        # Start up Postgres DB
        self.PG_BIN_DIR = "/usr/lib/postgresql/14/bin"
        self.PG_DATA_DIR = "/var/lib/postgresql/data"

        # PostgreSQL configuration
        self.PG_ROOT_USER = os.environ.get("PG_ROOT_USER", "postgres")
        self.PG_ROOT_PWD = os.environ.get("PG_ROOT_PWD", "postgres")
        self.PG_APP_USER = os.environ.get("PG_APP_USER", "app_user")
        self.PG_APP_PWD = os.environ.get("PG_APP_PWD", "change_me")
        self.PG_APP_DB   = os.environ.get("PG_APP_DB", "app_db")

    def wait_for_mainzelliste(self, url="http://localhost:7887/health", timeout=60, interval=2):
        """
        Polling for Mainzelliste Healthcheck.
        Attempts to establish a connection regularly until the timeout is reached.
        """
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    self.flame.flame_log("Healthcheck successful")
                    return True
            except requests.exceptions.ConnectionError:
                # Service noch nicht erreichbar, warten
                pass
            
            self.flame.flame_log("Waiting for Mainzelliste...")
            time.sleep(interval)

        self.flame.flame_log("Timeout: Mainzelliste is unavailable.")
        return False

    def run_as_postgres(self):
        self.flame.flame_log("Set postgres instead of root...")
        pw = pwd.getpwnam("postgres")
        os.setgid(pw.pw_gid)
        os.setuid(pw.pw_uid)

    def init_db(self):
        """Initialises the database directory if it does not yet exist."""
        if not os.path.exists(os.path.join(self.PG_DATA_DIR, "PG_VERSION")):
            self.flame.flame_log("Initialise database directory...")
            subprocess.run(
                [f"{self.PG_BIN_DIR}/initdb", "-D", self.PG_DATA_DIR, "--encoding=UTF8", "--locale=en_US.UTF-8"],
                check=True,
                preexec_fn=self.run_as_postgres,
                env=os.environ
            )
        else:
            self.flame.flame_log("Database directory already exists.")

    def start_postgres(self):
        """Starts PostgreSQL in a blocking manner until it is ready."""
        self.flame.flame_log("Start PostgreSQL...")
        subprocess.run(
            [f"{self.PG_BIN_DIR}/pg_ctl", "start", "-D", self.PG_DATA_DIR, "-w", "-t", "60"],  # -w = wait, -t 60 = Timeout 60s
            check=True,
            preexec_fn=self.run_as_postgres,
            env=os.environ
        )
        self.flame.flame_log("PostgreSQL ist ready.")

    def create_user_and_db(self):
        """Creates the application user and the database."""
        sql_commands = f"""
        CREATE USER {self.PG_APP_USER} WITH PASSWORD '{self.PG_APP_PWD}';
        CREATE DATABASE {self.PG_APP_DB} OWNER {self.PG_APP_USER} ENCODING = 'UTF-8';
        \\c {self.PG_APP_DB}
        CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
        """
        self.flame.flame_log(f"Initialise database {self.PG_APP_DB} and user {self.PG_APP_USER}...")
        subprocess.run(
            [f"{self.PG_BIN_DIR}/psql", "-U", self.PG_ROOT_USER, "-d", "postgres"],
            input=sql_commands,
            text=True,
            check=True
        )
        self.flame.flame_log("Database and user successfully created.")

    def stop_postgres(self):
        """Exits PostgreSQL cleanly."""
        self.flame.flame_log("Stop PostgreSQL...")
        subprocess.run(
            [f"{self.PG_BIN_DIR}/pg_ctl", "stop", "-D", self.PG_DATA_DIR, "-m", "fast"],  
            # -m fast = beendet Verbindungen, speichert sofort
            check=True,
            preexec_fn=self.run_as_postgres,
            env=os.environ
        )
        self.flame.flame_log("PostgreSQL has been stopped.")

    def get_new_pseudonyms(self, keep_keys, data, addpatienturl, headers):
        pseudonyms = {}
        for file_bytes in data[0].values():
            decoded = file_bytes.decode("utf-8") 
            csv_reader = csv.DictReader(io.StringIO(decoded), delimiter=";") 
            for index, row in enumerate(csv_reader):
                self.flame.flame_log("row: ")
                self.flame.flame_log(str(row)) 
                filtered_payload = {key: row[key] for key in keep_keys}
                add_row = requests.post(addpatienturl, json = filtered_payload, headers = headers)
                if add_row.status_code == 201: # TODO: was wenn possible match (also 409)?
                    self.flame.flame_log("Adding patient to Mainzelliste succeeded")
                    resp_data = add_row.json()  
                    if resp_data and isinstance(resp_data, list):
                        pseudonym = resp_data[0].get("idString", "Not found")
                        pseudonyms[pseudonym] = index # TODO: andersrum? weil bei gleichen wird sonst überschrieben
                elif add_row.status_code == 409:
                    self.flame.flame_log("Can't handle Possible Match yet")
        return pseudonyms

    def create_session_and_token(self, url: str, payload: dict, content_header: dict, api_key: dict) -> str:
        """Creates a new Mainzelliste session and returns the token ID."""
        headers = {**content_header, **api_key}
        session_resp = requests.post(f"{url}/sessions", headers=api_key)
        session_resp.raise_for_status()
        sessionid = list(session_resp.json().values())[0]

        token_req_url = f"{url}/sessions/{sessionid}/tokens"
        token_resp = requests.post(token_req_url, json=payload, headers=headers)
        token_resp.raise_for_status()
        return token_resp.json()["id"]

    def add_patients(self, keep_keys, data, url, content_header, api_key):
        """Adds patients to the Mainzelliste and returns pseudonyms."""
        for file_bytes in data[0].values():
            decoded = file_bytes.decode("utf-8")
            csv_reader = csv.DictReader(io.StringIO(decoded), delimiter=";")
            row_count = sum(1 for _ in csv_reader)

        headers = {**content_header, **api_key}
        add_payload = {
            "type": "addPatient",
            "allowedUses": row_count,
            "data": {"idTypes": ["pid"]}
        }
        token_id = self.create_session_and_token(url, add_payload, content_header, api_key)
        addpatienturl = f"{url}/patients?tokenId={token_id}"

        return self.get_new_pseudonyms(keep_keys, data, addpatienturl, headers)

    def get_bloomfilters(self, pseudonyms, url, content_header, api_key):
        """Reads bloomfilters for given pseudonyms and returns them sorted."""
        headers = {**content_header, **api_key}
        search_ids = [{"idType": "pid", "idString": pid} for pid in pseudonyms.keys()]
        self.flame.flame_log("search ids get bloomfilters: ")
        self.flame.flame_log(str(search_ids))

        payload_read = {
            "type": "readPatients",
            "data": {
                "searchIds": search_ids,
                "resultFields": [
                    "vorname_bigram_bloom", "nachname_bigram_bloom",
                    "geburtstag_bigram_bloom", "geburtsmonat_bigram_bloom",
                    "geburtsjahr_bigram_bloom", "plz_bigram_bloom", 
                    "ort_bigram_bloom"
                ],
                "resultIds": ["pid"]
            }
        }

        token_id = self.create_session_and_token(url, payload_read, content_header, api_key)
        readpatienturl = f"{url}/patients?tokenId={token_id}"

        resp = requests.get(readpatienturl, headers=headers)
        if resp.status_code != 200:
            self.flame.flame_log(f"Error retrieving bloomfilters: {resp.status_code}")
            return []

        patients_with_index = []
        for patient in resp.json() or []:
            pid = patient["ids"][0]["idString"]
            index = pseudonyms.get(pid)
            if index is not None:
                patients_with_index.append((index, patient["fields"]))

        return sorted(patients_with_index, key=lambda x: x[0])
    
    def cleanup(self, mainzelliste_proc):
        """Shut down Mainzelliste and PostgreSQL."""
        self.flame.flame_log("End Mainzelliste...")
        mainzelliste_proc.terminate()
        try:
            mainzelliste_proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            self.flame.flame_log("Mainzelliste doesn't react. Force kill.")
            mainzelliste_proc.kill()

        self.stop_postgres()

    def analysis_method(self, data, aggregator_results):
        """
        Performs analysis on the retrieved data from data sources.

        :param data: A list of dictionaries containing the data from each data source.
                     - Each dictionary corresponds to a data source.
                     - Keys are the queries executed, and values are the results (dict for FHIR, str for S3).
        :param aggregator_results: Results from the aggregator in previous iterations.
                                   - None in the first iteration.
                                   - Contains the result from the aggregator's aggregation_method in subsequent iterations.
        :return: Any result of your analysis on one node (ex. patient count).
        """
        if aggregator_results == None: # 0 iteration
            self.flame.flame_log("0. Iteration")
            return None
        elif "config" in aggregator_results[0]: # 1 iteration
            self.flame.flame_log("1. Iteration")
            self.flame.flame_log("Config received from aggregator...")

            # Save Config
            self.flame.flame_log("Save config received from aggregator...")
            config = aggregator_results[0]["config"]
            temp_dir = tempfile.mkdtemp()
            config_path = os.path.join(temp_dir, f"config.toml")
            with open(config_path, "wb") as f:
                tomli_w.dump(config, f)

            self.flame.flame_log("Final analyzer configuration created under:", config_path)

            self.init_db()
            self.start_postgres()
            self.create_user_and_db()

            # Start Mainzelliste 
            binary_path = "/usr/local/bin/mainzelliste"
            env = os.environ.copy()
            env["PG_HOST"] = "localhost"
            env["PG_APP_USER"] = "app_user"
            env["PG_APP_PWD"] = "change_me"
            env["PG_APP_DB"] = "app_db"
            env["SQL_DIR"] = "../src/sql/"
            env["TABLE_NAME"] = "patients"
            env["PG_ROOT_DB"] = "postgres"
            env["PG_ROOT_USER"] = "postgres"
            env["PG_ROOT_PWD"] = "postgres"
            env["CONFIG_PATH"] = config_path

            try:
                self.result = subprocess.Popen(
                    [binary_path, "--config", config_path], 
                    env=env,
                    cwd=os.path.dirname(config_path),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                self.flame.flame_log("Mainzelliste was started in the background...")
            except Exception as e:
                self.flame.flame_log(f"Starting Mainzelliste failed:{e}")

            # Health check
            url = "http://localhost:7887"

            if self.wait_for_mainzelliste():
                self.flame.flame_log("Mainzelliste ist ready!")
                content_header = {"Content-Type": "application/json"}
                api_key = {"mainzellisteApiKey": "changeme1"}
                # Get keys to compare with in pattern matching from configuration
                keep_keys = list(config.get("patient_settings", {}).keys())

                pseudonyms = self.add_patients(keep_keys, data, url, content_header, api_key)
                self.flame.flame_log("Get bloomfilters from patients...")
                patients_sorted = self.get_bloomfilters(pseudonyms, url, content_header, api_key)

                return {self.flame.get_id(): patients_sorted}
            else:
                self.flame.flame_log("Healthcheck failed, couldn't start Mainzelliste")

        else: #2. Iteration
            self.flame.flame_log("2. Iteration:")
            self.flame.flame_log("aggregator results:")
            self.flame.flame_log(str(aggregator_results))

            duplicates = aggregator_results[0][self.flame.get_id()]
            self.flame.flame_log("duplicates:")
            self.flame.flame_log(str(duplicates))

            self.flame.flame_log("Save intermediate data...")
            self.flame.save_intermediate_data(
                data=duplicates,
                location="local",
                tag="record-linkage-results"
            )

            self.cleanup(self.result)  # End Mainzelliste + Postgres
            return "finished"

           


class RLAggregator(StarAggregator):
    def __init__(self, flame):
        """
        Initializes the custom Aggregator node.

        :param flame: Instance of FlameCoreSDK to interact with the FLAME components.
        """
        flame.flame_log("Init of aggregator started ...")
        super().__init__(flame)  # Connects this aggregator to the FLAME components
        # Generate config + salt here to send to data nodes?
        self.hub_results = {} 
        flame.flame_log("Generate configs ...")
        aggregator_config_path = self.create_config_aggregator()
        self.flame.flame_log("Creating config for Analyzer nodes...")
        self.analyzer_config_dict = self.create_config_nodes()

        flame.flame_log("Start DB postgres ...")

        # Start postgres db 
        self.PG_BIN_DIR = "/usr/lib/postgresql/14/bin"
        self.PG_DATA_DIR = "/var/lib/postgresql/data"

        # PostgreSQL configuration
        self.PG_ROOT_USER = os.environ.get("PG_ROOT_USER", "postgres")
        self.PG_ROOT_PWD = os.environ.get("PG_ROOT_PWD", "postgres")
        self.PG_APP_USER = os.environ.get("PG_APP_USER", "app_user")
        self.PG_APP_PWD = os.environ.get("PG_APP_PWD", "change_me")
        self.PG_APP_DB   = os.environ.get("PG_APP_DB", "app_db")

        self.init_db()
        self.start_postgres()
        self.create_user_and_db()
        
        flame.flame_log("Start Aggregator Mainzelliste with Config ...")
        # Start Aggregator ML
        binary_path = "/usr/local/bin/mainzelliste"
        env = os.environ.copy()
        env["PG_HOST"] = "localhost"
        env["PG_APP_USER"] = "app_user"
        env["PG_APP_PWD"] = "change_me"
        env["PG_APP_DB"] = "app_db"
        env["SQL_DIR"] = "../src/sql/"
        env["TABLE_NAME"] = "patients"
        env["PG_ROOT_DB"] = "postgres"
        env["PG_ROOT_USER"] = "postgres"
        env["PG_ROOT_PWD"] = "postgres"
        env["CONFIG_PATH"] = aggregator_config_path

        try:
            self.mainzelliste = subprocess.Popen(
                [binary_path, "--config", aggregator_config_path],
                env=env,
                cwd=os.path.dirname(aggregator_config_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            flame.flame_log("Mainzelliste was started in the background.")
        except Exception as e:
            flame.flame_log(f"Error starting Mainzelliste:{e}")

        flame.flame_log("Init of aggregator finished ...")

    def wait_for_mainzelliste(self, url="http://localhost:7887/health", timeout=60, interval=2):
        """
        Polling for Mainzelliste Healthcheck.
        Attempts to establish a connection regularly until the timeout is reached.
        """
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    self.flame.flame_log("Healthcheck successful")
                    return True
            except requests.exceptions.ConnectionError:
                pass
            
            self.flame.flame_log("Waiting for Mainzelliste...")
            time.sleep(interval)

        self.flame.flame_log("Timeout: Mainzelliste is unavailable.")
        return False

    def run_as_postgres(self):
        self.flame.flame_log("Set postgres instead of root...")
        pw = pwd.getpwnam("postgres")
        os.setgid(pw.pw_gid)
        os.setuid(pw.pw_uid)

    def init_db(self):
        """Initialises the database directory if it does not yet exist."""
        if not os.path.exists(os.path.join(self.PG_DATA_DIR, "PG_VERSION")):
            self.flame.flame_log("Initialise database directory...")
            subprocess.run(
                [f"{self.PG_BIN_DIR}/initdb", "-D", self.PG_DATA_DIR, "--encoding=UTF8", "--locale=en_US.UTF-8"],
                check=True,
                preexec_fn=self.run_as_postgres,
                env=os.environ
            )
        else:
            self.flame.flame_log("Database directory already exists.")

    def start_postgres(self):
        """Starts PostgreSQL in a blocking manner until it is ready."""
        self.flame.flame_log("Start PostgreSQL...")
        subprocess.run(
            [f"{self.PG_BIN_DIR}/pg_ctl", "start", "-D", self.PG_DATA_DIR, "-w", "-t", "60"],  # -w = wait, -t 60 = Timeout 60s
            check=True,
            preexec_fn=self.run_as_postgres,
            env=os.environ
        )
        self.flame.flame_log("PostgreSQL ist ready.")

    def create_user_and_db(self):
        """Creates the application user and database."""
        sql_commands = f"""
        CREATE USER {self.PG_APP_USER} WITH PASSWORD '{self.PG_APP_PWD}';
        CREATE DATABASE {self.PG_APP_DB} OWNER {self.PG_APP_USER} ENCODING = 'UTF-8';
        \\c {self.PG_APP_DB}
        CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
        """
        self.flame.flame_log(f"Initialise database {self.PG_APP_DB} and user {self.PG_APP_USER}...")
        subprocess.run(
            [f"{self.PG_BIN_DIR}/psql", "-U", self.PG_ROOT_USER, "-d", "postgres"],
            input=sql_commands,
            text=True,
            check=True
        )
        self.flame.flame_log("Database and user successfully created.")

    def stop_postgres(self):
        """Shuts down PostgreSQL"""
        self.flame.flame_log("Stop PostgreSQL...")
        subprocess.run(
            [f"{self.PG_BIN_DIR}/pg_ctl", "stop", "-D", self.PG_DATA_DIR, "-m", "fast"],  
            check=True,
            preexec_fn=self.run_as_postgres,
            env=os.environ
        )
        self.flame.flame_log("PostgreSQL has been stopped.")

    def all_nodes_intersect(self, all_matches: dict):
        # Determine global intersection
        node_values = [set(matches.values()) for matches in all_matches.values()]
        hub_res = set.intersection(*node_values) if node_values else set()

        # Collect pairwise duplicates
        section_res = {node: {} for node in all_matches}  
        pairwise_counts = {}  

        for node1, node2 in combinations(all_matches.keys(), 2):
            matches1 = all_matches[node1]
            matches2 = all_matches[node2]

            # Common values between node1 and node2
            common_values = set(matches1.values()) & set(matches2.values())

            # Keys per node that have these values
            keys1 = {k for k, v in matches1.items() if v in common_values}
            keys2 = {k for k, v in matches2.items() if v in common_values}

            # Sort results
            section_res[node1].setdefault(node2, set()).update(keys1)
            section_res[node2].setdefault(node1, set()).update(keys2)

            # Count pairs of intersections
            pairwise_counts[f"{node1}:{node2}"] = len(common_values)

        # Add global result
        pairwise_counts["total"] = len(hub_res)

        return pairwise_counts, section_res
    
    def create_config_nodes(self):
        salt_hex = get_random_bytes(64).hex()
        config_path = os.path.join(os.path.dirname(__file__), "config.toml")

        if not os.path.exists(config_path):
            raise FileNotFoundError(f"{config_path} not found. CWD: {os.getcwd()}, contents: {os.listdir('.')}")

        with open(config_path, "rb") as f:
            user_config = tomllib.load(f)
        self.flame.flame_log(f"Config loaded:{user_config}")

        patient_settings = user_config.get("patient_settings", {})
        matcher_frequency = user_config.get("matcher_frequency", {})
        matcher_error_rate = user_config.get("matcher_error_rate", {})
        required_fields = user_config.get("required_fields", {})
        validate_fields = user_config.get("validate_fields", {})
        validate_date = user_config.get("validate_date", {})
        thresholds = user_config.get("thresholds", {})
        exchange_groups = user_config.get("exchange_groups", {})
        config_content = {
            "salt" : f"{salt_hex}",
            "ids": {"internal_id": "pid"},
            "id_generator": {
                "pid": {"generator": "PIDGenerator", "k1": 1, "k2": 2, "k3": 3}
            },
            "database": {
                "url": "localhost:5432/app_db",
                "username": "app_user",
                "password": "change_me"
            },
            "servers": [
                {
                    "api_key": "changeme1",
                    "permissions": [
                        "createSession",        # Allows the creation of sessions
                        "createToken",          # Allows the creation of tokens
                        "tt_deletePatient",
                        "tt_addPatient",
                        "tt_readPatients",
                        "tt_editPatient"
                    ]
                }
            ],
            # === DEFAULT PATIENT SETTINGS ===
            "patient_settings": {
                "vorname": "String",
                "nachname": "String",
                "geburtsname": "String",
                "geburtstag": "Integer",
                "geburtsmonat": "Integer",
                "geburtsjahr": "Integer",
                "ort": "String",
                "plz": "Integer"
            },
            "matcher_frequency": {
                "vorname": 0.000235,
                "nachname": 0.0000271,
                "geburtsname": 0.0000271,
                "geburtstag": 0.0333,
                "geburtsmonat": 0.0833,
                "geburtsjahr": 0.0286,
                "ort": 0.01,
                "plz": 0.01
            },
            "matcher_error_rate": {
                "vorname": 0.01,
                "nachname": 0.008,
                "geburtsname": 0.008,
                "geburtstag": 0.005,
                "geburtsmonat": 0.002,
                "geburtsjahr": 0.004,
                "ort": 0.04,
                "plz": 0.04
            },
            "required_fields": {
                "vorname": True,
                "nachname": True,
                "geburtsname": True,
                "geburtstag": True,
                "geburtsmonat": True,
                "geburtsjahr": True,
                "ort": False,
                "plz": False
            },
            "validate_fields": {
                "vorname": r"^[A-Za-zäÄöÖüÜßáÁéÉèÈ\.\- ]*[A-Za-zäÄöÖüÜßáÁéÉèÈ]+[A-Za-zäÄöÖüÜßáÁéÉèÈ\.\- ]*$",
                "nachname": r"^[A-Za-zäÄöÖüÜßáÁéÉèÈ\.\- ]*[A-Za-zäÄöÖüÜßáÁéÉèÈ]+[A-Za-zäÄöÖüÜßáÁéÉèÈ\.\- ]*$"
            },
            "validate_date": {
                "fields": ["geburtstag", "geburtsmonat", "geburtsjahr"]
            },
            "thresholds": {
                "is_match": 0.95,
                "non_match": 0.95
            },
            "exchange_groups": {
                "exchange_group_0": ["vorname","nachname","geburtsname"],
                "exchange_group_1": ["geburtstag","geburtsjahr","geburtsmonat"]
            }
        }
    
        if patient_settings:
            config_content["patient_settings"] = patient_settings
        if matcher_frequency:
            config_content["matcher_frequency"] = matcher_frequency
        if matcher_error_rate:
            config_content["matcher_error_rate"] = matcher_error_rate
        if required_fields:
            config_content["required_fields"] = required_fields
        if validate_fields:
            config_content["validate_fields"] = validate_fields
        if validate_date:
            config_content["validate_date"] = validate_date
        if thresholds:
            config_content["thresholds"] = thresholds
        if exchange_groups:
            config_content["exchange_groups"] = exchange_groups
        matcher_comparators = {
            field: "DiceCoefficientComparator" for field in config_content["patient_settings"].keys()
        }

        config_content["matcher_comparators"] = matcher_comparators

        return config_content 
            
    # Generate Config
    def create_config_aggregator(self):
        config_path = os.path.join(os.path.dirname(__file__), "config.toml")

        if not os.path.exists(config_path):
            raise FileNotFoundError(f"{config_path} not found. CWD: {os.getcwd()}, contents: {os.listdir('.')}")

        with open(config_path, "rb") as f:
            user_config = tomllib.load(f)
        self.flame.flame_log(f"Config loaded:{user_config}")

        patient_settings = user_config.get("patient_settings", {})
        matcher_frequency = user_config.get("matcher_frequency", {})
        matcher_error_rate = user_config.get("matcher_error_rate", {})
        required_fields = user_config.get("required_fields", {})
        validate_fields = user_config.get("validate_fields", {})
        validate_date = user_config.get("validate_date", {})
        thresholds = user_config.get("thresholds", {})
        exchange_groups = user_config.get("exchange_groups", {})

        aggregator_config = {
            "ids": {"internal_id": "pid"},
            "id_generator": {
                "pid": {"generator": "PIDGenerator", "k1": 1, "k2": 2, "k3": 3}
            },
            "database": {
                "url": "localhost:5432/app_db",
                "username": "app_user",
                "password": "change_me"
            },
            "servers": [
                {
                    "api_key": "changeme1",
                    "permissions": [
                        "createSession",        # Allows the creation of sessions
                        "createToken",          # Allows the creation of tokens
                        "tt_deletePatient",
                        "tt_addPatient",
                        "tt_readPatients",
                        "tt_editPatient"
                    ]
                }
            ],
            # === DEFAULT PATIENT SETTINGS ===
            "patient_settings": {
                "vorname": "String",
                "nachname": "String",
                "geburtsname": "String",
                "geburtstag": "Integer",
                "geburtsmonat": "Integer",
                "geburtsjahr": "Integer",
                "ort": "String",
                "plz": "Integer"
            },
            "matcher_frequency": {
                "vorname": 0.000235,
                "nachname": 0.0000271,
                "geburtsname": 0.0000271,
                "geburtstag": 0.0333,
                "geburtsmonat": 0.0833,
                "geburtsjahr": 0.0286,
                "ort": 0.01,
                "plz": 0.01
            },
            "matcher_error_rate": {
                "vorname": 0.01,
                "nachname": 0.008,
                "geburtsname": 0.008,
                "geburtstag": 0.005,
                "geburtsmonat": 0.002,
                "geburtsjahr": 0.004,
                "ort": 0.04,
                "plz": 0.04
            },
            "required_fields": {
                "vorname": True,
                "nachname": True,
                "geburtsname": True,
                "geburtstag": True,
                "geburtsmonat": True,
                "geburtsjahr": True,
                "ort": False,
                "plz": False
            },
            "validate_fields": {
                "vorname": r"^[A-Za-zäÄöÖüÜßáÁéÉèÈ\.\- ]*[A-Za-zäÄöÖüÜßáÁéÉèÈ]+[A-Za-zäÄöÖüÜßáÁéÉèÈ\.\- ]*$",
                "nachname": r"^[A-Za-zäÄöÖüÜßáÁéÉèÈ\.\- ]*[A-Za-zäÄöÖüÜßáÁéÉèÈ]+[A-Za-zäÄöÖüÜßáÁéÉèÈ\.\- ]*$"
            },
            "validate_date": {
                "fields": ["geburtstag", "geburtsmonat", "geburtsjahr"]
            },
            "thresholds": {
                "is_match": 0.95,
                "non_match": 0.95
            },
            "exchange_groups": {
                "exchange_group_0": ["vorname","nachname","geburtsname"],
                "exchange_group_1": ["geburtstag","geburtsjahr","geburtsmonat"]
            }
        }

        if patient_settings:
            aggregator_config["patient_settings"] = patient_settings
        if matcher_frequency:
            aggregator_config["matcher_frequency"] = matcher_frequency
        if matcher_error_rate:
            aggregator_config["matcher_error_rate"] = matcher_error_rate
        if required_fields:
            aggregator_config["required_fields"] = required_fields
        if validate_fields:
            aggregator_config["validate_fields"] = validate_fields
        if validate_date:
            aggregator_config["validate_date"] = validate_date
        if thresholds:
            aggregator_config["thresholds"] = thresholds
        if exchange_groups:
            aggregator_config["exchange_groups"] = exchange_groups
        
        matcher_comparators = {
            field: "BloomFilterComparator" for field in aggregator_config["patient_settings"].keys()
        }

        aggregator_config["matcher_comparators"] = matcher_comparators

        temp_dir = tempfile.mkdtemp()
        final_config_path = os.path.join(temp_dir, "config.toml")
        with open(final_config_path, "wb") as f:
            tomli_w.dump(aggregator_config, f)

        self.flame.flame_log("Final aggregator configuration created under:", final_config_path)
        return final_config_path


    def aggregation_method(self, analysis_results):
        """
        Aggregates the results received from all analyzer nodes.

        :param analysis_results: A list of analysis results from each analyzer node.
        :return: The aggregated result (e.g., total patient count across all analyzers).
        """
        self.flame.flame_log("analysis results:") # 1 iteration
        self.flame.flame_log(str(analysis_results))
        if analysis_results[0] is None: # 0 iteration
            self.flame.flame_log("0 iteration") 
            return {"config": self.analyzer_config_dict}
        
        elif analysis_results[0] == "finished":
            self.flame.flame_log("aggregator finishes")
            return self.hub_results
        
        else:
            self.flame.flame_log("1 iteration") 
            self.flame.flame_log("analysis results 1st iteration:") # 1 iteration
            self.flame.flame_log(str(analysis_results))

            # Health check
            url = "http://localhost:7887"
            if self.wait_for_mainzelliste():
                self.flame.flame_log("Connected to Mainzelliste...") 

                # Perform Matching on Bloomfilters
                allowed_uses = 0
                for bloomfilter in analysis_results:
                    for node_id, bloom_data in bloomfilter.items():
                        if bloom_data is None:
                            continue
                        allowed_uses += len(bloom_data)
                content_header = {"Content-Type": "application/json"}
                api_key = {"mainzellisteApiKey": "changeme1"}
                headers = {**content_header, **api_key}
                payload = {
                    "type": "addPatient",
                    "allowedUses": allowed_uses,
                    "data": {
                        "idTypes": ["pid"]
                    }
                }

                sessionidreq = requests.post(url + "/sessions", headers = api_key)
                sessionid = list(sessionidreq.json().values())[0]
                tokenreq = url + "/sessions" + "/" + sessionid + "/tokens"
                tokenidreq = requests.post(tokenreq, json = payload, headers = headers)
                tokenid = tokenidreq.json()["id"]
                addpatienturl = url + "/patients?tokenId=" + tokenid

                matches_all_nodes = {}
                for bloomfilter in analysis_results:
                    for node_id, bloom_data in bloomfilter.items():
                        if bloom_data is None:
                            self.flame.flame_log(f"No answer from {node_id}")
                            continue

                        matches = {}
                        for patient in bloom_data: 
                            getId = requests.post(addpatienturl, json = patient[1], headers = headers)
                            if getId.status_code == 201: 
                                data = getId.json()  
                                if data and isinstance(data, list):
                                    pseudonym = data[0].get("idString", "Not found")
                                    matches[f"{patient[0]}"] = pseudonym 
                            elif getId.status_code == 409:
                                self.flame.flame_log("Possible Match occured - counted as Non Match")

                        matches_all_nodes[node_id] = matches

                # Calculate intersect of all nodes
                self.hub_results, node_results = self.all_nodes_intersect(matches_all_nodes)
                self.flame.flame_log("node_results:")
                self.flame.flame_log(str(node_results))
                
                self.flame.flame_log("Mainzelliste is terminated...")
                self.mainzelliste.terminate()   
                try:
                    self.mainzelliste.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    self.flame.flame_log("Mainzelliste not responding. Force kill.")
                    self.mainzelliste.kill()
            
                self.stop_postgres()
                return node_results
            else:
                self.flame.flame_log("Healthcheck failed, couldn't start Mainzelliste")

    def has_converged(self, result, last_result, num_iterations):
        """
        Determines if the aggregation process has converged.

        :param result: The current aggregated result.
        :param last_result: The aggregated result from the previous iteration.
        :param num_iterations: The number of iterations completed so far.
        :return: True if the aggregation has converged; False to continue iterations.
        """
        # TODO (optional): if the parameter 'simple_analysis' in 'StarModel' is set to False,
        #  this function defines the exit criteria in a multi-iterative analysis (otherwise ignored)
        #return True  # Return True to indicate convergence in this simple analysis
        if num_iterations >= 2:
            return True
        return False
    

def main():
    """
    Sets up and initiates the distributed analysis using the FLAME components.

    - Defines the custom analyzer and aggregator classes.
    - Specifies the type of data and queries to execute.
    - Configures analysis parameters like iteration behavior and output format.
    """
    StarModel(
        analyzer=RLAnalyzer,  # Custom analyzer class (must inherit from StarAnalyzer)
        aggregator=RLAggregator,  # Custom aggregator class (must inherit from StarAggregator)
        data_type='s3',  # Type of data source ('fhir' or 's3') -> wir machen zunächst mit s3
        # query='Patient?_summary=count',  # Query or list of queries to retrieve data -> bei fhir?
        simple_analysis=False,  # True for single-iteration; False for multi-iterative analysis
        output_type='str',  # Output format for the final result ('str', 'bytes', or 'pickle')
        #pickle ->  speichern komplexer Python-Objekte (z. B. Dictionaries, Numpy-Arrays, Modelle, etc.).
        analyzer_kwargs=None,  # Additional keyword arguments for the custom analyzer constructor (i.e. MyAnalyzer)
        aggregator_kwargs=None  # Additional keyword arguments for the custom aggregator constructor (i.e. MyAggregator)
    )

        
if __name__ == "__main__":
    main()
