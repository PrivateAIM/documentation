export const deploymentRoutes = [
    {
        text: 'Prequirements',
        collapsed: true,
        items: [
            { text: 'microk8s', link: '/microk8s-quickstart' },
            { text: 'minikube', link: '/minikube-quickstart' },
        ]
    },
    {
        text: 'Hub',
        items: [
            { text: 'Overview', link: '/hub-introduction' },
            { text: 'Installation', link: '/hub-installation' },
            { text: 'Storage', link: '/hub-storage' },
            { text: 'Docker Compose (Dev)', link: '/hub-docker-compose' },
        ]
    },
    {
        text: 'Node',
        items: [
            {
                text: 'Installation',
                link: '/node-installation'
            },
            {
                text: 'Registering in the Hub',
                link: '/node-registration'
            },
            {
                text: 'Troubleshooting',
                link: '/node-troubleshooting'
            },
        ]
    },
]
