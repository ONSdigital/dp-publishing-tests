ONS publishing platform acceptance tests
================

Acceptance tests for the publishing platform for [ons.gov.uk](https://www.ons.gov.uk).

## Getting started

You'll either need access to an environment with the publishing platform running or you'll need to run the [publishing platform locally](https://github.com/ONSdigital/dp/blob/master/GETTING_STARTED.md#publishing).

Before running anything against an environmen you'll need to run the command
```
make install
```

There are a few options on how the tests can be run:

### On an environment
If you have access to a live environment and want to run the full test suite:
```
PUBLISHING_ENV_URL=https://publishing.develop.onsdigital.co.uk ROOT_ADMIN_PASSWORD='<password for florence@magicroundabout.ons.gov.uk account>' TEMP_USER_PASSWORD='<password for temporary user created by tests>' make test
```

### On a local machine
To run the whole test suite locally (which assumes Florence is being run on it's default bind address of `:8081`) you'll need to run:
```
ROOT_ADMIN_PASSWORD='<password for florence@magicroundabout.ons.gov.uk account>' TEMP_USER_PASSWORD='<password for temporary user created by tests>' make test-local
```

### Configuration

The following environment variables are available when running the tests:

\* = Required to run tests

| Environment variable | Default                                       | Description                                                                                                                                        |
|----------------------|-----------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| TEMP_USER_PASSWORD*  |  none                                         | Password to assign to the temporary admin account that is created to run the test suite                                                            |
| ROOT_ADMIN_PASSWORD* |  none                                         | Password of the existing admin account that will be used to create temporary users during tests                                                    |
| ROOT_ADMIN_EMAIL     | "florence@magicroundabout.ons.gov.uk"         | Email address of the existing admin account that will be used to create temporary users during tests                                               |
| PUBLISHING_ENV_URL      | "https://publishing.develop.onsdigital.co.uk" | URL for the environment to run the test suite on                                                                                                   |
| DEBUG                | false                                         | If `true` it runs the tests in developer mode, so it doesn't run headlessly, it slows down actions and pipe's the browsers console to the terminal |
| HEADLESS             | true                                          | If `false` it opens the browser, so that all actions taken during the tests can be seen                                                            |
| SKIP_SETUP_TEARDOWN  | false                                         | If `true` then the global setup and teardown won't run with the test suite                                                                        |


### Contributing

See [CONTRIBUTING](CONTRIBUTING.md) for details.

### License

Copyright © 2017-2018, Office for National Statistics (https://www.ons.gov.uk)

Released under MIT license, see [LICENSE](LICENSE.md) for details.
