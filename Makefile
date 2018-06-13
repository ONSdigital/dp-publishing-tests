PUBLISHING_ENV_URL ?= https://publishing.develop.onsdigital.co.uk
WEB_ENV_URL ?= https://develop.onsdigital.co.uk
ROOT_ADMIN_EMAIL ?= florence@magicroundabout.ons.gov.uk
ROOT_ADMIN_PASSWORD ?= Doug4l
SKIP_SETUP_TEARDOWN ?= false

install:
	npm install

test:
	PUBLISHING_ENV_URL=${PUBLISHING_ENV_URL} ROOT_ADMIN_EMAIL=${ROOT_ADMIN_EMAIL} ROOT_ADMIN_PASSWORD='${ROOT_ADMIN_PASSWORD}' TEMP_USER_PASSWORD='${TEMP_USER_PASSWORD}' SKIP_SETUP_TEARDOWN=${SKIP_SETUP_TEARDOWN} npm run test

test-local:
	PUBLISHING_ENV_URL=http://localhost:8081 make test

test-smoke:
	PUBLISHING_ENV_URL=${PUBLISHING_ENV_URL} ROOT_ADMIN_EMAIL=${ROOT_ADMIN_EMAIL} ROOT_ADMIN_PASSWORD='${ROOT_ADMIN_PASSWORD}' TEMP_USER_PASSWORD='${TEMP_USER_PASSWORD}' SKIP_SETUP_TEARDOWN=true npm run test:smoke

.PHONY: install test test-local test-smoke