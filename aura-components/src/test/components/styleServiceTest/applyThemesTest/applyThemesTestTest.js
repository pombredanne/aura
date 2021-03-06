/*
 * Copyright (C) 2013 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
({

    // test multiple css files

    /** test utility */
    map: {
        "#DECC8C": "rgb(222, 204, 140)",
        "#DE986D": "rgb(222, 152, 109)",
        "#AB6890": "rgb(171, 104, 144)",
        "#68AB9F": "rgb(104, 171, 159)",
        "#DEC371": "rgb(222, 195, 113)",
        "#39CCCC": "rgb(57, 204, 204)",
        "#F012BE": "rgb(240, 18, 190)",
        "#776C8E": "rgb(119, 108, 142)"
    },

    /** test utility */
    assertColors: function(elements, color1, color2, color3, color4, color5) {
        // test assumptions
        $A.assert($A.util.isArray(elements), "missing elements");
        $A.assert(elements.length === 5, "should have 5 elements");
        $A.assert(!$A.util.isUndefinedOrNull(color1), "missing color");
        $A.assert(!$A.util.isUndefinedOrNull(color2), "missing color");
        $A.assert(!$A.util.isUndefinedOrNull(color3), "missing color");
        $A.assert(!$A.util.isUndefinedOrNull(color4), "missing color");
        $A.assert(!$A.util.isUndefinedOrNull(color5), "missing color");
        $A.assert(!$A.util.isUndefinedOrNull(this.map[color1]), "invalid color");
        $A.assert(!$A.util.isUndefinedOrNull(this.map[color2]), "invalid color");
        $A.assert(!$A.util.isUndefinedOrNull(this.map[color3]), "invalid color");
        $A.assert(!$A.util.isUndefinedOrNull(this.map[color4]), "invalid color");
        $A.assert(!$A.util.isUndefinedOrNull(this.map[color5]), "invalid color");

        // actual test assertions
        var style = $A.util.style;
        $A.test.assertEquals(this.map[color1], style.getCSSProperty(elements[0], "color"));
        $A.test.assertEquals(this.map[color2], style.getCSSProperty(elements[1], "color"));
        $A.test.assertEquals(this.map[color3], style.getCSSProperty(elements[2], "color"));
        $A.test.assertEquals(this.map[color4], style.getCSSProperty(elements[3], "color"));
        $A.test.assertEquals(this.map[color5], style.getCSSProperty(elements[4], "color"));
    },

    /** test applying a single theme at once */
    testSingleTheme: {
        test: function(component) {
            var loaded = false;
            var colors = component.getElements();

            $A.styleService.applyTheme("styleServiceTest:colorOverridesTheme1", {
                callback: function() {loaded = true}
            });

            $A.test.addWaitFor(true, function() {return loaded}, function() {
                // first three overridden, last two remain from default
                this.assertColors(colors, "#39CCCC", "#39CCCC", "#39CCCC", "#68AB9F", "#DEC371");
            });
        }
    },

    /** test applying multiple themes at once */
    testMultipleThemes: {
        test: function(component) {
            var loaded = false;
            var colors = component.getElements();

            var toApply = [
                "styleServiceTest:colorOverridesTheme1",
                "styleServiceTest:colorOverridesTheme2",
            ]

            $A.styleService.applyThemes(toApply, {
                callback: function() {loaded = true}
            });

            $A.test.addWaitFor(true, function() {return loaded}, function() {
                // first three overridden from first, last three overridden from second
                this.assertColors(colors, "#39CCCC", "#39CCCC", "#F012BE", "#F012BE", "#F012BE");
            });
        }
    },

    /** test with multiple themes in succession, default behavior (should be equal to replaceExisting false) */
    testMultipleThemesReplaceExistingDefault: {
        test: function(component) {
            var loaded = false;
            var colors = component.getElements();

            $A.styleService.applyTheme("styleServiceTest:colorOverridesTheme1", {
                callback: function() {
                    $A.styleService.applyTheme("styleServiceTest:colorOverridesTheme2", {
                        callback: function() {loaded = true}
                    })
                }
            });

            $A.test.addWaitFor(true, function() {return loaded}, function() {
                // first three overridden from first, last three overridden from second
                this.assertColors(colors, "#39CCCC", "#39CCCC", "#F012BE", "#F012BE", "#F012BE");
            });
        }
    },

    /** test with multiple themes in succession, replaceExisting explicitly false */
    testMultipleThemesReplaceExistingExplicitlyFalse: {
        test: function(component) {
            var loaded = false;
            var colors = component.getElements();

            $A.styleService.applyTheme("styleServiceTest:colorOverridesTheme1", {
                callback: function() {
                    $A.styleService.applyTheme("styleServiceTest:colorOverridesTheme2", {
                        replaceExisting: false,
                        callback: function() {loaded = true}
                    })
                }
            });

            $A.test.addWaitFor(true, function() {return loaded}, function() {
                // first three overridden from first, last three overridden from second
                this.assertColors(colors, "#39CCCC", "#39CCCC", "#F012BE", "#F012BE", "#F012BE");
            });
        }
    },

    /** test with multiple themes in succession, replaceExisting explicitly true */
    testMultipleThemesReplaceExistingExplicitlyTrue: {
        test: function(component) {
            var loaded = false;
            var colors = component.getElements();

            $A.styleService.applyTheme("styleServiceTest:colorOverridesTheme1", {
                callback: function() {
                    $A.styleService.applyTheme("styleServiceTest:colorOverridesTheme2", {
                        replaceExisting: true,
                        callback: function() {loaded = true}
                    })
                }
            });

            $A.test.addWaitFor(true, function() {return loaded}, function() {
                // first two from default, last three overridden from second
                this.assertColors(colors, "#DECC8C", "#DE986D", "#F012BE", "#F012BE", "#F012BE");
            });
        }
    },

    /** test with client loaded style def. client loaded styles should be included in overrides from server */
    testWithClientLoadedStyleDefs: {
        test: function(component) {
            var loaded = false;
            var addedCmp;

            // dynamically load a cmp
            $A.componentService.newComponentAsync(
                this,
                function(newCmp){
                    addedCmp = newCmp;
                    //Add the new cmp to the body array
                    var body = component.get("v.body");
                    body.push(newCmp);
                    component.set("v.body", body);

                    // after adding, apply theme
                    $A.styleService.applyTheme("styleServiceTest:colorOverridesTheme1", {
                        callback: function() {loaded = true}
                    });
                },
                {
                    "componentDef": "markup://styleServiceTest:asyncLoaded"
                }
            );

            $A.test.addWaitFor(true, function() {return loaded}, function() {
                // we are testing that a client loaded cmp's styles are included in what css
                // comes back from the server, when applicable
                var toTest = addedCmp.getElement();
                $A.test.assertEquals(this.map["#39CCCC"], $A.util.style.getCSSProperty(toTest, "color"));
            });
        }
    },

    /** test unapply multiple themes */
    testRemoveThemes: {
        test: function(component) {
            var loaded = false;
            var colors = component.getElements();

            $A.styleService.applyTheme("styleServiceTest:colorOverridesTheme1", {
                callback: function() {
                    $A.styleService.applyTheme("styleServiceTest:colorOverridesTheme2", {
                        replaceExisting: false,
                        callback: function() {loaded = true}
                    })
                }
            });

            $A.test.addWaitFor(true, function() {return loaded}, function() {
                $A.styleService.removeThemes();
                // should be defaults
                this.assertColors(colors, "#DECC8C", "#DE986D", "#AB6890", "#68AB9F", "#DEC371");
            });
        }
    },

    /** test with a map provider theme */
    testUsingMapProvidedTheme: {
        test: function(component) {
            var loaded = false;
            var colors = component.getElements();

            $A.styleService.applyTheme("styleServiceTest:mapProvidedTheme", {
                callback: function() {loaded = true}
            });

            $A.test.addWaitFor(true, function() {return loaded}, function() {
                // first three overridden, last two remain from default
                this.assertColors(colors, "#776C8E", "#DE986D", "#AB6890", "#68AB9F", "#DEC371");
            });
        }
    }
})