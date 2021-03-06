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
    click : function(cmp, event){
        if ($A.util.getBooleanValue(cmp.get("v.stopPropagation"))) {
            //IE9 & Other Browsers
            if (event.stopPropagation) {
              event.stopPropagation();
            }
            //IE8 and Lower
            else {
              event.cancelBubble = true;
            }
        }

        if ($A.util.getBooleanValue(cmp.get("v.disabled"))) {
            event.preventDefault();
            return false;
        }

        var clickEvent = cmp.getEvent("linkClick");
        clickEvent.setParams({ "domEvent" : event });
        clickEvent.fire();

        var navigateToUrl = !$A.util.getBooleanValue(cmp.get("v.stopNavigation"));
        if (!navigateToUrl) {
            event.preventDefault();
        }

        return navigateToUrl;
    }
})
