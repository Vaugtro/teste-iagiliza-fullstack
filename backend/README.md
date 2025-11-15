# Executando o Projeto

### Preencha as variáveis de ambiente conforme determinado no arquivo
`.env.example`

### Caso pretenda utilizar dockers de IA, rode o seguinte comando do `docker compose` para iniciar o projeto:
`docker compose -f docker-compose.dev.yml --profile ${GPU_TYPE} up`

  Onde *GPU_TYPE* é determinado pelo tipo de placa de video, que pode ser *rocm* para AMD ou *nvidia* para NVIDIA

### Caso queira rodar somente o projeto sem IA, utilize o seguinte comando:
`docker compose -f docker-compose.dev.yml --profile backend up`