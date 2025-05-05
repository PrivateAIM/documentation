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
            {text: 'Analysis Coding', link: '/analysis-coding'},
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
