# Applying platform SDK and CLI to run a Deep Learning application


The more detailed guide to the deep learning showcase can be read [here](../Guide-showcase-deep-learning-image-classifier.pdf)

::: warning Assumed Knowledge
This guide assumes you're already familiar with the basic concepts of federated learning. If not, read the background docs on [Coding an Analysis](/guide/user/analysis-coding) and the [Core SDK](/guide/user/sdk-core-doc).


::: info Summary
This tutorial shows how to train a deep learning based image classifier  on **FLAME** using the external frameworks such as **PyTorch** and the provided reference script <a href="https://github.com/PrivateAIM/showcases/tree/main/image-classifier/Image_analysis_on_flame_cuda.py" download>Image_classifier_training.py</a>.
It is a demonstration workflow whose main purpose is to demonstrate platform capabilities for machine learning applications.

:::

::: info Download
Download the full reference script:  <a href="https://github.com/PrivateAIM/showcases/tree/main/image-classifier/Image_analysis_on_flame_cuda.py" download>Image_classifier_training.py</a>
:::


## Goal
Briefly train the neural network based image classifier for a few epochs inside the multi-round federated analysis: handle model weight exchange and aggregation, enforce convergence criteria based on the change in loss function, and compute basic metrics across nodes without moving raw image datasets between nodes.

By the end of this tutorial you will learn how to use Star patterns, and how to collect the results of federated training.


::: tip The reason why we use Python as the language of choice is that there is no better alternative for this kind of application due to its suitable ecosystem
:::

## What does the analysis code do?
Brief overview:
* Analyzer runs network training for few specified number of epochs, then returns a dictionary with updated weights, loss value
* The aggregator subclass computes federated average of the returned model weights, loss and its metrics received from analyzer node, and checks convergence criterion each round
* Upon the training is finished the results are serialized and saved as the pickle file in the Hub storage


## Prerequisites
- Properly prepared S3 buckets on MinIO Object Store that include the tarball archive of the used dataset
- Configured datastores on each participating node that refer to respective S3 buckets
- A deep learning master image with all necessary dependencies being available


## Output Structure
An expected real output is a serialized dictionary that includes the following keys with values of data types as shown in the mapping below:
```python
{'model':torch.Tensor,
'loss':float,
'num_classes':int,
'prediction_scores':List[float],
'accuracy':float,
'avg_f1':float,
'avg_precision':float,
'avg_recall':float
}
```


## Common issues


## Additional references
* [The Intro into coding an analysis script](/guide/user/analysis-coding)
* [The documentation about Core SDK](/guide/user/sdk-core-doc)
* [PyTorch documentation](https://docs.pytorch.org/docs/stable/index.html)



---

Author: Gherman Sergey
