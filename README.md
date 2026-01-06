## Develop

This is just a basic web extension that serves as a quicker access to tab search in firefox

Easy way to run without taking too much space and immediately opening browser console:
`web-ext run --arg="--width=800" --arg="--height=800" --browser-console`
It's recommended to set an alias for this. For example `wr`

### If this doesn't work under ubuntu

this may not work in ubuntu. just uninstall the snap version of firefox and install either the deb package from the website (i think this should work) or do this (https://askubuntu.com/a/1404401)

## Build

To build the project and get an installable version, run 
```
web-ext sign --api-key="user:{the-user-id}" --api-secret="{the-api-secret}" --channel="unlisted"
```
Note that the signing process can take several minutes.

## Install

Install form the `.xpi`-file.
To update it, a new version has to be signed.

## Docs

I had the problem of websites being able to inject javscript as script tags when setting their title to some malicious code. I fixed it by using templates and hydration via `element.textContent`. To verify this, the following snippet `document.title = '<div style="width: 10rem; height: 10rem; background: red;"></div>'` can quickly be used to set such a malicious title. This should now be safe and not display a red square in the menu. The same applies when such a page is bookmarked.