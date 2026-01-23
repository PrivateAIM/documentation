export const userRoutes = [
    {
        text: 'Quick Start',
        link: '/'
    },
    {
        text: 'Python Core SDK',
        link: '/sdk-core-doc'
    },
    {
        text: 'Concepts/Tutorials',
        collapsed: true,
        items: [
            {
                text: 'Analysis Coding',
                collapsed: true,
                items: [
                    {text: 'Introduction', link: '/analysis-coding'},
                    {
                        text: 'Examples',
                        collapsed: true,
                        items: [
                            {text: 'Aggregation with fedstats', link: '/coding_examples/survival-regression.md'},
                            {text: 'Federated GLM', link: '/coding_examples/federated-logistic-regression.md'},
                            {text: 'GeMTeX text scores', link: '/coding_examples/gemtex-text-score-example'},
                            {text: 'PPRL', link: '/coding_examples/record_linkage'},
                            {text: 'Basic VCF QC', link: '/coding_examples/vcf-qc'},
                            {text: 'CLI Tools FastQC', link: '/coding_examples/cli-fastqc'},
                            {text: 'Differential Privacy', link: '/coding_examples/differential-privacy-dp'}
                        ]
                    },
                ]

            },
            {
                text: 'Local Testing',
                collapsed: true,
                items: [
                    {text: 'Introduction', link: '/local-testing'},
                    {
                        text: 'Examples',
                        collapsed: true,
                        items: [
                            {text: 'Logistic Regression', link: '/testing_examples/local-testing-logistic-regression-example'},
                            {text: 'Differential Privacy', link: '/testing_examples/local-testing-dp-example'},
                        ]
                    },
                ]
            },
            {text: 'FHIR Queries', link: '/fhir-query'},
            // {text: 'Homomorphic Encryption', link: '/homomorphic-encryption'},
        ]
    },
    {
        text: 'Using the Hub',
        collapsed: true,
        items: [
            // {text: 'Key Management', link: '/guide/user/key-management'},
            {
                text: 'Submitting a Project Proposal',
                link: '/project'
            },
            {
                text: 'Starting an Analysis',
                link: '/analysis'
            },
        ]
    },
]
