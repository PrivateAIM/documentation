# App

The central app contains the following services:
- user-interface,
- api (authorization- & resource-server)
- realtime-server
- train-manager
- ...

Those are managed in a mono-repository on GitHUb.
Contributions are very welcome and be performed by following the guideline of the README in the repository.

::: info Info
Assure yourself that you are not using `dash` as default shell.
Therefore, run the command `dpkg-reconfigure dash` to make the adjustment if necessary.
:::

## Installation
```shell
git clone https://github.com/PHT-Medic/central-deployment
cd central-deployment
```

## Configuration

```shell
$ ./env.sh
```

This command will create environment files in the following directories:
- config/.env
- config/api/.env
- config/realtime/.env
- config/third-party/authup/.env
- config/train-manager/.env
- config/ui/.env

Change the values to your needs.

::: warning Info
Don't forget to replace the placeholders with the actual values:
- `[APP_URL]`: Web address (e.g. https://app.example.com/)
- `[APP_API_URL]`: Web address (e.g. https://app.example.com/api/)
- `[AUTHUP_API_URL]`: Web address of the authup service (e.g. https://app.example.com/auth/)
:::

The following values need to be adjusted before running the setup script!

**`config/api/.env`**
```dotenv
API_URL=[API_URL]
APP_URL=[APP_URL]
AUTHUP_API_URL=[AUTHUP_API_URL]
```

**`config/realtime/.env`**
```dotenv
AUTHUP_API_URL=[AUTHUP_API_URL]
```

**`config/third-party/authup/.env`**
```dotenv
AUTHORIZE_REDIRECT_URL=[APP_URL]
```

**`config/train-manager/.env`**
```dotenv
API_URL=[API_URL]
AUTHUP_API_URL=[AUTHUP_API_URL]
```

**`config/ui/.env`**
```dotenv
API_URL=[API_URL]
APP_URL=[APP_URL]
AUTHUP_API_URL=[AUTHUP_API_URL]
```

## Setup
To set up everything just run the following command:
```
$ ./setup.sh
```
This will download the docker image and run initial project setup 🔥.

## Usage
Start 🛫
```
$ ./third-party.sh start
$ ./start.sh
```
Stop 🛬
```
$ ./third-party.sh stop
$ ./stop.sh
```

Reset 🪂
```
$ ./reset.sh
```




