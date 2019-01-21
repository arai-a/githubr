all:
	rm -f hubr.xpi
	zip -9 hubr.xpi background.js hubr.js hubr.css options.html options.js manifest.json

i: all
	open -a FirefoxNightly hubr.xpi

ia: all
	open -a FirefoxAurora hubr.xpi
