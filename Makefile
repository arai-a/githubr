all:
	rm -f githubr.xpi
	zip -9 githubr.xpi background.js githubr.js githubr.css options.html options.js manifest.json

i: all
	open -a FirefoxNightly githubr.xpi

ia: all
	open -a FirefoxAurora githubr.xpi
