# Introduction 
::: warning Info
This section is only required if you want to use the FLAME software completely independently of the PrivateAim infrastructure provided by  https://privateaim.net
:::
## Requirements
The following guide is based on some shared assumptions:

- OS `debian` or `ubuntu`
- Nginx `v1.18.x` is installed
- Docker `v20.x` is installed
- Min. `4` cores
- Min. `20G` hard disk
- Domain for `harbor` (e.g. harbor.example.com) & `app` (e.g. app.example.com) with certificates

## Placeholders

The following placeholders are used in the following sections:
- `[HARBOR_DOMAIN]` Domain name (e.g. harbor.example.com)
- `[HARBOR_SSL_CRT]`: Certificate file (.crt)
- `[HARBOR_SSL_KEY]`: Certificate key file (.key)
- `[APP_DOMAIN]` Domain name (e.g. app.example.com)
- `[APP_URL]`: Web address (e.g. https://app.example.com/)
- `[APP_API_URL]`: Web address (e.g. https://app.example.com/api/)
- `[AUTHUP_API_URL]`: Web address of the authup service (e.g. https://app.example.com/auth/)
- `[APP_SSL_CRT]`: Certificate file (.crt)
- `[APP_SSL_KEY]`: Certificate key file (.key)
