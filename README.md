# file-operator

## multi-thread ability
Depending on your computer cores, the maximum of threads is 16.

## unit test
`cmd >> npm run test`

## test with postman operation
### 1. launch
`cmd >> docker-compose up --build -d`

### 2. launch, then monitor by logs
`cmd >> docker-compose up --build`
<br>
you can see the ordered result in detail by different conditions (size, lastModified, fileName)

### 3. postman setup
a). check the restful-api scripts under './app/docs/'.
<br>
b). import scripts into postman (both api and env-params).
<br>
c). play read/create/overwrite/delete operation with file.
