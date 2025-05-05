export const adminRoutes = [
    {
        text: 'Quick Start',
        link: '/'
    },
    {
        text: 'Reviewing',
        link: '/reviewing'
    },
    {
        text: 'Hub',
        collapsed: true,
        items: [
            {text: 'Realms', link: '/realms'},
            {text: 'Identity Providers', link: '/identity-providers'},
            {text: 'Robots', link: '/robots'},
            {text: 'Users', link: '/users'},
            {text: 'Roles', link: '/roles'},
            {text: 'Permissions', link: '/permissions'},
            {text: 'Nodes', link: '/node-management'},
            {text: 'Project Review', link: '/project-review'},
            {text: 'Analysis Review', link: '/analysis-review'},
        ]
    },
    {
        text: 'Node',
        collapsed: true,
        items: [
            {text: 'Data Store Management', link: '/data-store-management'},
            {text: 'Analysis Execution', link: '/analysis-execution'},
            {text: 'Keycloak & Access Control', link: '/keycloak-access-control'}
        ]
    },
]
