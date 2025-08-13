# Federated logistic regression using `fedstats`

In this example we fit a logistic regression on distributed data using a federated version of the Fisher scoring algorithm [[1](#ref-1)].  
We use already implemented features from `fedstats` to iteratively update global estimates of parameters at every node over multiple rounds until convergence.

> [!NOTE]  
> This is an illustrative example. We simulate random data at every node such that the calculations can be conducted. Info about data usage can be found elsewhere.

## Procedure

> [!NOTE]  
> Info about the object classes `StarAnalyzer`, `StarAggregator`, their mandatory components and the `main()` function can be found in other tutorials.
**First iteration:**  

*At nodes:*  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1. Generate local data using convergence function `simulate_logistic_regression`.  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2. Initialize instance of `PartialFisherScoring`. It will calculate the relevant parts of the Fisher scoring that are submitted to the aggregator.  

*At aggregator:*  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1. Initialize an instance of `FederatedGLM`. It will later handle to calculate the full Fisher information from the parts calculated at the nodes.  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2. Set convergence flag to `False` (more information about it are given at the end of the page).  

**Iterate the following process until convergence:**  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.[*Nodes*] Set received estimates from aggregator as current.  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2.[*Nodes*] Calculate, based on local data and current estimates all parts of the Fisher scoring algorithm and return them to aggregator.  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.[*Aggregator*] Set results from nodes.  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;4.[A*ggregator*] Use the results to estimate a full score vector and Fisher information matrix and update coefficients of regression model.  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;5.[*Aggregator*] In the last round after convergence: return summary as final results.  

> [!NOTE]  
> We need to keep track of convergence using a extra variable `_convergence_flag` because we want to modify the last result: We want more than just the current parameters of the model, but all relevant info that is usually used in a GLM (like standard errors, z-scores and p-values). Details why we we solve it in this way can be found at the end of the document.  

```python
import numpy as np
from flame.star import StarModel, StarAnalyzer, StarAggregator
from fedstats import FederatedGLM, PartialFisherScoring
from fedstats.util import simulate_logistic_regression


class LocalFisherScoring(StarAnalyzer):
    def __init__(self, flame):
        super().__init__(flame)  # Connects this analyzer to the FLAME components
        self.iteration = 0
        local_PRNGKey = np.random.randint(1, 99999)
        X, y = simulate_logistic_regression(
            local_PRNGKey, n=50, k=1
        )  # k=1 as we need only one dataset
        self.X, self.y = X[0], y[0]

        self.local_model_parts = PartialFisherScoring(
            self.X, self.y, family="binomial", fit_intercept=False
        )
        print(f"Initial values of beta: {self.local_model_parts.beta}")

    def analysis_method(self, data, aggregator_results):
        """
        Runs local parts of the federated fisher scoring
        Fits score vector and fisher information matrix on current values from aggregator results
        aggregator_results should be a list with one element. This element is a tuple 2 elements:
        1. Aggregation results (np.ndarray) 2. convergence flag
        """
        # first iteration, aggregator gives no results and therefore None, use local inital values
        if self.iteration == 0:
            # wrap as a list (reason in next line)
            aggregator_results = [(self.local_model_parts.beta, False)]

        # aggregator_results are a list with one element
        aggregator_results = aggregator_results[0]

        # if condition checks, converged flag. In the case of convergence, return the result
        if not aggregator_results[1]:
            aggregator_results = aggregator_results[0]
            self.iteration += 1
            print(f"Aggregator results are: {aggregator_results}")
            self.local_model_parts.set_coefs(aggregator_results)
            return self.local_model_parts.calc_fisher_scoring_parts(verbose=True)
        else:
            return aggregator_results[0]


class FederatedLogisticRegression(StarAggregator):
    def __init__(self, flame):
        """
        Initializes aggregator object and iteratively checks for convergence
        and aggegates fisher scoring parts from each node
        """
        super().__init__(flame)  # Connects this aggregator to the FLAME components
        self.glm = FederatedGLM()

        # additional tmp flag to keep track of convergence *independent* of convergence in has_converged() to modify final result
        self._convergence_flag = False

    def aggregation_method(self, analysis_results):
        if not self._convergence_flag:
            self.glm.set_results(analysis_results)
            self.glm.aggregate_results()
            return self.glm.get_coefs(), self._convergence_flag
        else:
            return self.glm.get_summary()

    def has_converged(self, result, last_result, num_iterations):
        if self._convergence_flag:
            print(f"Converged after {num_iterations} iterations.")
            return True

        convergence = self.glm.check_convergence(last_result[0], result[0], tol=1e-4)
        if convergence:
            # TODO: Currently, a the following is a workaround. Another round of analysis is done with no results such that
            # the final result can be modified. Maybe there is a better solution in the future.
            self._convergence_flag = True
            return False  # here, False is returned even though convergence is achieved to perform a final "redundant" round
        elif num_iterations > 100:
            # TODO: Include option for max iteration and not hardcoded tol
            print(
                "Maximum number of 100 iterations reached. Returning current results."
            )
            return True
        else:
            return False


def main():
    StarModel(
        analyzer=LocalFisherScoring,
        aggregator=FederatedLogisticRegression,
        data_type="s3",
        simple_analysis=False,
        output_type="str",
        analyzer_kwargs=None,
        aggregator_kwargs=None,
    )


if __name__ == "__main__":
    main()
```

<!--TODO: Explain issue with converged flag-->

## References

<span id="ref-1">[1]</span> Cellamare, Matteo, et al. *A federated generalized linear model for privacy-preserving analysis.* **Algorithms** 15.7 (2022): 243.
