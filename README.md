
# Frontend Editing Module

## Maintainer Contact

Marcus Nyeholt

<marcus (at) silverstripe (dot) com (dot) au>

## Requirements

SilverStripe 3.0

## Documentation

SilverStripe 2.4 version still available in the ss24 branch

The frontend editing module adds the ability to edit HTML based content on
the frontend of your website. Developers specify in their templates the
fields they want to be able to edit, add an include for buttons to help with
switching between edit and standard views, and that's all there is to it.

Add the following to your project's configuration.yml file

````
---
Name: frontend_config
---
SiteTree:
  extensions:
    - FrontendEditableExtension

```

In the templates for the page types you would like editable, add the 
following in place of raw output fields - for example, instead of `$Content`, 
use

````
$EditableField(Content)
````

As well as single fields of the current page, you can use it on 
other objects contained in a control block (so long as those
objects have the EditableExtension)

````
<ul>
<% control Items %>
	<li>$EditableControl(Title)</li>
<% end_control %>
</ul>
````

Also in your template, add the following at the top. It includes some
controls for initiating the editor (if you want them). You can provide
your own mechanism for launching the editor, but this is simpler :)

````
<% include FrontendEditingControls %>
````


**NOTE** after adding the above, when navigating to a page in 'Live' mode,
if you have edit access to the page, hovering your mouse over the bottom
right corner of the screen will display controls for launching the edit
mode. In "Stage" view, these controls should appear immediately. 

## API

**Defining new plugins for the editor**


@TODO - for now, see nicedit-image-selector.js or nicedit-url-selector.js as
examples. 

## Troubleshooting

* Appending `?stage=Stage&startEditing=true` to the current URL will 
  open the editor immediately; if this does _not_ happen, check your JS error
  console!