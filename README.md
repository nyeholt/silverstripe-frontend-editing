
# Frontend Editing Module

## Maintainer Contact

Marcus Nyeholt

<marcus (at) silverstripe (dot) com (dot) au>

## Requirements

SilverStripe 2.4.x

## Documentation

The frontend editing module adds the ability to edit HTML based content on
the frontend of your website. Developers specify in their templates the
fields they want to be able to edit, add an include for buttons to help with
switching between edit and standard views, and that's all there is to it.

Add the following to your _config.php for the pages you want editable

````

DataObject::add_extension('Page', 'FrontendEditableExtension');
DataObject::add_extension('Page', 'FrontendLockable');

````

In your templates, add the following in place of raw output fields - for
example, instead of `$Content`, you use

````

$EditableField(Content)

````

Also in your template, add the following at the top. It includes some
controls for initiating the editor (if you want them). You can provide
your own mechanism for launching the editor, but this is simpler :)

````
<% include FrontendEditingControls %>
````

## API

**Defining new plugins for the editor**


## Troubleshooting