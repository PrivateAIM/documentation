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
                text: 'Examples',
                collapsed: true,
                items: [
                    {text: 'Analysis Coding', link: '/analysis-coding'},
                    {text: 'Aggregation with fedstats', link: '/survival-regression.md'},
                    {text: 'Federated GLM', link: '/federated-logistic-regression.md'},
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
