export const navBarRoutes = [
    {
        text: 'Getting Started',
        link: '/getting-started',
        activeMatch: '/getting-started'
    },
    {
        text: 'Docs',
        activeMatch: '/guide',
        items: [
            {text: 'User', link: '/guide/user'},
            {text: 'Admin', link: '/guide/admin'},
            {text: 'Deployment', link: '/guide/deployment'},
        ]
    },
    {
        text: 'About',
        activeMatch: '/about/',
        items: [
            {text: 'Team', link: '/about/team'},
        ]
    }
]
