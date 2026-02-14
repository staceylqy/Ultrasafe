PYTHON := python

.PHONY: setup run

setup:
	$(PYTHON) -m pip install -r requirements.txt

run:
	$(PYTHON) -m ultrasafe

