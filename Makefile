all: map.js

clean: map.js
	rm -f map.js

map.js: map-src.js settings.js import.awk
	gawk -f $(CURDIR)/import.awk $< > $@
