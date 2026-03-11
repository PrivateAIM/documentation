export const deploymentRoutes = [
    {
        text: 'Installing k8s',
        collapsed: true,
        items: [
            { text: 'microk8s', link: '/microk8s-quickstart' },
            { text: 'minikube', link: '/minikube-quickstart' },
        ]
    },
    {
        text: 'Hub Deployment',
        items: [
            { text: 'Helm Chart Installation', link: '/hub-installation' },
            { text: 'Storage Setup', link: '/hub-storage' },
            { text: 'Docker Compose (Dev)', link: '/hub-docker-compose' },
        ]
    },
    {
        text: 'Node Deployment',
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
