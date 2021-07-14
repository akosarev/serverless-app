PROJECT=serverless

STACK="serverless"
SERVERLESS_LAMBDA=src/serverless_lambda

default: help

help:
	@echo 'Usage: make [target] ...'
	@echo
	@echo 'Targets:'
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep  \
	| sed -e 's/^\(.*\):[^#]*#\(.*\)/\1 \2/' | tr '#' "\t"


##----------- INSTALL ---------------------------------------------------------
##
#### Installation instructions:
## 1 - Make a virtualenv "make virtualenv" for local python development.
## 2 - Activate the vitualenv "source .venv/bin/activate".
## 3 - Install all the dev packages in your virtualenv "make install".
##     This will also install a typescript CDK environment to develop the
##     aws infrastructure.
##

virtualenv: #### Create a virtualenv for the python lambda environment (make sure python3 is 3.8)
	python3 -m venv .venv

install: install-python install-js #### Install python and typescript dependencies

install-python: #### Install python dependencies.
	cd src && pip3 install -r requirements-dev.txt -r requirements.txt

install-js: #### Install typescript dependencies.
	cd src && npm install && npm install --only=dev

#### ---------------------------------DEV-----------------------------------------

black: ##### Run Black - the python code formatter
	black -l 80 .

prettier: #### Run Prettier - the javascript/typescript code formatter
	cd src && npm run prettier **/*.ts --write

#### ---------------------------------TEST----------------------------------------
test: test-mypy test-black test-pylint

test-black: #### Test the python code formatting
	black -l 80 . --check

test-mypy: #### Run static code type analysis for python
	PYTHONPATH=${SERVERLESS_LAMBDA} mypy ${SERVERLESS_LAMBDA}

test-pylint: #### Run python linter
	 PYTHONPATH=${SERVERLESS_LAMBDA} pylint -f parseable --rcfile=setup.cfg -j 4 ${SERVERLESS_LAMBDA} --persistent=n

#### ---------------------------------BUILD---------------------------------------

build: ##### Compile the CDK stack and synthesize into Cloudformation
	cd src && npm run build
	cd src && npm run cdk synth


#### ---------------------------------DEPLOY--------------------------------------

deploy: ### Deploy serverless
	cd src && npm run cdk deploy ${STACK} -- --require-approval never || (echo "deployment for ${STACK} failed"; exit 1)

#### --------------------------------DESTROY--------------------------------------
destroy: ### Destroy serverless
	cd src && npm run cdk destroy ${STACK}
