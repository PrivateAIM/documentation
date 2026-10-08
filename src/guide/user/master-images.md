# Requesting a Master Image

A **master image** is the container image your analysis code is built on. It provides the runtime (e.g. Python) and
all software dependencies. Packages cannot be installed while an analysis runs, so every library your script imports
has to be part of the master image you select when [creating the analysis](/guide/user/analysis).

All master images are maintained in the public
[PrivateAIM/master-images](https://github.com/PrivateAIM/master-images) repository. If none of them fits, you request
a new one with a pull request. This page describes that process:

1. [Check whether a suitable image already exists](#_1-check-the-existing-master-images)
2. [Create your own master image](#_2-create-your-master-image)
3. [Test it locally](#_3-test-the-image-locally)
4. [Open a pull request](#_4-open-a-pull-request)
5. [Synchronize the Hub](#_5-synchronize-the-hub)

## 1. Check the existing master images

Please check first whether a master image already contains the dependencies you need. Every image is a folder below
[`data/`](https://github.com/PrivateAIM/master-images/tree/master/data) in the repository, and its
`requirements.txt` lists the installed packages.

| Location | Contains | Examples |
|---|---|---|
| `data/python/` | general purpose Python images | `base`, `ml`, `pytorch`, `tensorflow`, `genomics` |
| `data/python/use-cases/` | images built for a specific project or analysis | `fedstats`, `gemtex`, `record-linkage` |
| `data/python/conda/` | images based on a conda environment | `fed-gwas` |
| `data/r/` | R images | `ml` |

The same images are offered in the Hub in the **Image** tab of the analysis wizard.

If an existing image only lacks one or two packages, consider proposing to extend it instead of adding a new one.

## 2. Create your master image

Create a new branch in the [master-images](https://github.com/PrivateAIM/master-images) repository. If you do not
have write access, fork the repository first.

```shell
git clone https://github.com/PrivateAIM/master-images.git
cd master-images
git checkout -b add-my-analysis-image
```

Then:

1. **Create a new folder** named after your master image, e.g. `data/python/use-cases/my-analysis/`. The folder name
   becomes the name of the image.
2. **Copy the `Dockerfile` and `requirements.txt`** of one of the examples into it, e.g. from `fedstats`, `gemtex` or
   `pytorch`. Pick the one closest to what you need: `fedstats` and `gemtex` start from a plain Python image, `pytorch`
   from an NVIDIA CUDA image for GPU workloads.
3. **Adjust `requirements.txt`** to the dependencies your analysis script requires.

```shell
mkdir data/python/use-cases/my-analysis
cp data/python/use-cases/fedstats/Dockerfile \
   data/python/use-cases/fedstats/requirements.txt \
   data/python/use-cases/my-analysis/
```

The resulting folder looks like this:

```
data/python/use-cases/my-analysis/
├── Dockerfile
├── requirements.txt
└── README.md
```

The `README.md` is optional and holds one or two sentences on what the image is for.

`requirements.txt`:

```
pandas == 2.2.3
numpy == 1.26.4
scikit-learn == 1.6.1
```

`Dockerfile` (copied from `fedstats`):

```dockerfile
FROM python:3.13
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update -yqq && \
    apt-get dist-upgrade -yqq && \
    apt-get install -yqq git

COPY requirements.txt /tmp/requirements.txt

RUN python3 -m pip install --upgrade pip

RUN pip3 install -r /tmp/requirements.txt

RUN pip3 install \
    git+https://github.com/PrivateAIM/python-sdk-patterns.git@1.0.0
```

A few rules:

* **Keep the last instruction.** It installs the FLAME SDK and patterns (`flame`). Without it your analysis cannot start.
  Use the same version as the example you copied from.
* **Pin every version** (`package == x.y.z`), so the image builds reproducibly and can be reviewed.
* **Do not list `flamesdk` dependencies in conflicting versions.** The SDK requires specific ranges of `httpx`,
  `fastapi` and `uvicorn`. If you need them, copy the versions from the example.
* **System packages or command line tools** are added with a further `apt-get install` in the `Dockerfile`.
* **No data, credentials or analysis code** belong in the image. The repository and the images are public, and your
  code is added later by the Hub.

The image group (`python`) and the start command (`python -u`) are inherited from the `image-group.json` of the parent
folder, so you do not need to configure them.

## 3. Test the image locally

Test before you open the pull request. A failed build, or an import error that only shows up on a node, costs
everybody a full review and approval round. You need [Docker](https://docs.docker.com/get-docker/).

**Build the image:**

```shell
docker build -t my-analysis:test data/python/use-cases/my-analysis
```

**Check that your dependencies are importable**, including `flame`:

```shell
docker run --rm my-analysis:test \
    python -c "import flame, pandas, sklearn; print('ok')"
```

**Run your analysis in the image.** Write a local test script for your analysis with `StarModelTester` as described in
[Local Testing](/guide/user/local-testing), then execute it inside the container instead of your own Python
environment:

```shell
docker run --rm -v "$PWD":/work -w /work my-analysis:test \
    python -u my_analysis_test.py
```

Run this from the folder that contains your script and test data. If it runs through, your script works with exactly
the package versions the nodes will use.

::: tip
The repository also ships a small CLI that builds an image the same way the CI does:

```shell
npm ci && npm run build
npm run cli -- list
npm run cli -- build python/use-cases/my-analysis
```
:::

## 4. Open a pull request

Commit the new folder, push your branch and open a pull request against the `master` branch of
[PrivateAIM/master-images](https://github.com/PrivateAIM/master-images/pulls).

```shell
git add data/python/use-cases/my-analysis
git commit -m "feat: add my-analysis master image"
git push -u origin add-my-analysis-image
```

Describe in the pull request which analysis or project the image is for and why no existing image fits. A maintainer
reviews the change.

After the pull request has been approved and merged, a worker automatically builds the new master image and pushes it
to the Hub's Harbor registry. You do not have to build or push anything yourself.

## 5. Synchronize the Hub

The Hub has to learn about the new image once:

1. In the Hub UI, go to **Admin → General → Services → Master Images**.
2. Press the green **Sync** button.

After a few minutes, the newly built master image is available for selection in projects and analyses.

::: info
Synchronizing requires the `MASTER_IMAGE_MANAGE` permission. If you do not see the page or the button, ask a Hub
administrator to trigger the synchronization for you.
:::

You can now select the image in the **Image** tab when
[creating an analysis](/guide/user/analysis#_3-configure-analysis).

## Updating an existing master image

To add or upgrade a package in an image that already exists, follow the same steps: change its `requirements.txt` or
`Dockerfile` on a branch, test locally, open a pull request and synchronize the Hub after the merge. Keep in mind that
other analyses may use the same image.

## Troubleshooting

| Problem | Likely cause | What to do |
|---|---|---|
| `docker build` fails in `pip3 install -r` | version does not exist, or conflicts with another package | fix the pin, and check the Python version in `FROM` |
| `ModuleNotFoundError: flame` | the `python-sdk-patterns` line was removed | restore the last instruction of the `Dockerfile` |
| Image does not appear in the Hub | not synchronized yet, or the build is still running | press **Sync** again after a few minutes |
| Analysis fails with `ModuleNotFoundError` on the node | package missing in `requirements.txt` | add it, and repeat the local test |
