export const deploymentRoutes = [
    // {
    //     text: 'System Requirements',
    //     link: '/hub-introduction',
    // },
    {
        text: 'Registering in the Hub',
        link: '/node-registration'
    },
    {
        text: 'Installing k8s',
        collapsed: true,
        items: [
            {text: 'microk8s', link: '/microk8s-quickstart'},
            {text: 'minikube', link: '/minikube-quickstart'},
        ]
    },
    {
        text: 'FLAME Node Deployment',
        link: '/node-installation'
    },
]
