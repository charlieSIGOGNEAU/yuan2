### verrifier ou preparer l'environement
 ```
 # \phpunit.xml dois contenir

<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
<env name="QUEUE_CONNECTION" value="sync"/>
```
### creer le fichier de test
```
# chemain du fichier a tester sans app\http\controller
php artisan make:test Api/V1/Game/QuickGameTest
# il se crera dans \tests\Feature et suite du chemain

# puis pour lancer les tests
php artisan test
```