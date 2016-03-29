#GPL2, Copyright 2015 Chad MILLER  http://chad.org/


WGET_ARGS := --tries=3 --user-agent=wget-for-code-for-orlando-chad-miller -nv -c

TEMPORARY_DATA_DIR := data-temporary
OUTPUT_DATA_DIR := data
BIN := data-generation

all:: test-right-location 
all:: $(OUTPUT_DATA_DIR)/typing-to-get-voterids.js
all:: $(OUTPUT_DATA_DIR)/trie-to-voterid-stamp
all:: $(OUTPUT_DATA_DIR)/voterid-lookup-stamp

registration.pdf:
	wget -q -O temp.pdf "http://dos.myflorida.com/media/693757/dsde39.pdf"
	mv temp.pdf $@

test-right-location:
	@echo Making sure this is run from the base directory...
	@test -d $(BIN)
	@echo good.

$(TEMPORARY_DATA_DIR)/download-stamp: INDEX_URL := http://flvoters.com/download/20160229.html
$(TEMPORARY_DATA_DIR)/download-stamp: 
	mkdir -p $(TEMPORARY_DATA_DIR)
	set -e; wget -O - $(WGET_ARGS) $(INDEX_URL) |grep \\.txt\" |cut -d\" -f2 |sed -e 's,http://flvoters.com/,,' |while read countyfilename; do echo $$countyfilename; echo $(TEMPORARY_DATA_DIR)/$$countyfilename; $(MAKE) $(TEMPORARY_DATA_DIR)/"$$countyfilename"; done
	touch $@

$(TEMPORARY_DATA_DIR)/download/%: 
	mkdir -p $(TEMPORARY_DATA_DIR)
	cd $(TEMPORARY_DATA_DIR); wget $(WGET_ARGS) --no-host-directories --force-directories http://flvoters.com/download/$*

$(TEMPORARY_DATA_DIR)/distribute-stamp: $(TEMPORARY_DATA_DIR)/download-stamp
	mkdir -p $(TEMPORARY_DATA_DIR)
	rm -f $(TEMPORARY_DATA_DIR)/birthdays-*
	rm -f $(TEMPORARY_DATA_DIR)/voterids-*
	set -e; find $(TEMPORARY_DATA_DIR)/download/ -type f -exec cat {} \; |$(BIN)/pigeonhole_lines_by_id_and_birthday $(TEMPORARY_DATA_DIR)
	touch $@

$(OUTPUT_DATA_DIR)/trie-to-voterid-stamp: $(TEMPORARY_DATA_DIR)/distribute-stamp
	mkdir -p $(OUTPUT_DATA_DIR)
	set -e; for f in $(TEMPORARY_DATA_DIR)/birthdays-*; do $(BIN)/construct_pii_to_voterid_trie $(OUTPUT_DATA_DIR) <$$f; done
	touch $@

$(OUTPUT_DATA_DIR)/voterid-lookup-stamp: $(TEMPORARY_DATA_DIR)/distribute-stamp
	mkdir -p $(OUTPUT_DATA_DIR)
	set -ex; for f in $(TEMPORARY_DATA_DIR)/voterids-*; do $(BIN)/construct_voterid_to_registration_lookup $(OUTPUT_DATA_DIR) $$f <$$f; done
	touch $@

$(OUTPUT_DATA_DIR)/%.js: scripts/%.coffee
	coffee --compile --output $(OUTPUT_DATA_DIR)/ $<
