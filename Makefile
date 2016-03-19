generate:
	data-generation/generate


registration.pdf:
	wget -q -O temp.pdf "http://dos.myflorida.com/media/693757/dsde39.pdf"
	mv temp.pdf $@
