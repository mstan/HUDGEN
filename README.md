# HUDGEN HUD Generator
HUDGEN is a HUD generator written by [Gamemaster](https://steamcommunity.com/id/Gamemaster1379) with the intent of making HUD iterations and generation easier.

# Setup & Usage

* Install NodeJS (recommended v8 or later)
* Clone/download repository
* `npm install`
* Copy your custom hud into /src/custom/
* Copy the latest version of the stock hud into /src/official/
* Run the command `node complete`

## What this does

Valve Data Format (VDF) is something that is strikingly similar to JSON--but not quite. This application takes both a user custom HUD and the official Valve HUD, and converts them into JSON. From there, a deep comparison is done to both sides. Any output is converted back to VDF before being written.

Using the comparison, a diff is first generated to show the differences between the user's custom HUD from the stock one. Any custom user values (keys) will show up here. Similarly, any stock keys with custom values will also show up here. Lastly, any official HUD elements that do not exist in the custom HUD will be added here as well. This last part is done in order to ensure that any new content added to the game is not left out, causing breaking changes.

The above diff is a great way for a person to see ONLY what has been changed in their custom HUD. For generating the actual HUD, this diff is used as the reference point (diff is compared to official instead of custom being compared to official). Therefore, in theory, a HUD editor could actually save a copy and directly modify the diff and apply it for future revisions, eliminating the need to modify a complete HUD file.

As mentioned above, the diff is generated and then compared to the official HUD. Comparisons made here are done and output into the /src/output.

## How output is compared and generated

For sake of example, the "Diff" (custom output) is compared to the "official" (stock HUD). The "diff" is the "left hand side" and the "official" is the "right hand side" in this situation.

The below logic is a bit backwards by how the comparison is done, so explanations should hopefully clarify any confusion.

### New Elements
A new element is an element that exists in the stock HUD, but the custom one does not have it. 

New elements are added to the "output". 

NOTE: If you are a custom HUD developer and want to have an EMPTY value, you cannot simply not include it--it will be added from stock. The best way to handle this is actually declare the value and use empty quotes to denote null.

For example:

```
"HudPlayerHealthValue" {
    "xpos_minmode" ""
    "ypos_minmode" ""
}
```
would be used in order to denote null values for the `xpos_minmode` and `ypos_minmode`. If this is left out of the custom HUD, stock values will be used instead.


### Edited Elements
An edited element is an element in the custom HUD that is different than what is in the stock HUD. Edited elements will be assigned to the custom HUD value.

### Deleted elements 
Deleted elements are elements that exist in the custom HUD but don't exist in the stock one. These elements are added to the final version as they are assumed to be added by the developer and are needed for custom logic.

## Notes

### hudanimations

`tf/scripts/hudanimations_tf.txt` is not supported as this is not standard VDF. Instead, the user is encouraged to use a custom hudanimations and include it in a manifest file. All .txt files are copied without parsing.
* `info.vdf` is required for all modern HUDs. This file should be included and is copied without parsing.

### Duplicate key values
Duplicate key values are not supported by default by vdf-parser. For example, in `resource/ui/teammenu.res`:

```
    "reddoor"
    {
        ...
        
        "model"
        {
            ...
            
            "animation"
            {
                "name"          "idle_enabled"
                "sequence"      "idle"
                "default"       "1"
            }

            "animation"
            {
                "name"          "idle_disabled"
                "sequence"      "fullidle"
            }           
            
            ...
            
            "animation"
            {
                "name"          "exit_disabled"
                "sequence"      "fullidle"
            }
            
            "animation"
            {
                "name"          "hover_disabled"
                "sequence"      "fullhover"
            }
        }
    }   
```

This VDF contains multiple difference animation sequences, all using the same "animation" key. In the VDF -> JSON parser this breaks as all of them are assigned to the same key, leaving only the last animation's values being assigned. The rest are clobbered and never re-assigned.

A custom verison of vdf-parser has been written by me to deal with this issue. This is done by postpending duplicate keys with the key found in the config.js file. This is what will be added and stripped when converting VDF <-> JSON. If this key has conflicts with your project, change the key to a new string in config.js. The key is arbitrary, but should not include any invalid key parameters that are not allowed in standard JSON keys.

### diff

The diff is auto-generated as a diff between the original and custom HUD. This diff can be redistributed to others for generations against the official HUD.


## Known Bugs and issues

* [$X360] and [$WIN32] are not supported. These are special tags postpended to key/value pairs that run based on whether the system is running in console mode or PC mode. The VDF parser cannot figure out the difference and will just try to assign the value twice. Therefore, the bottom value (most of the time, [$X360] is second) is the one assigned. This can break any HUDs that have both, but don't use the [$X360] value. It is recommended to remove these from all custom HUDs before running generation




