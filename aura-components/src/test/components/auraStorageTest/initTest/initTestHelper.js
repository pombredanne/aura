({
    resetCounters:function(cmp, _testName){
        var a = cmp.get('c.resetCounter');
        a.setParams({
            testName: _testName
        }),
        a.setExclusive();
        $A.test.enqueueAction(a);
    },
    executeAction:function(cmp, actionName, actionParam, additionalProperties, extraCallback){
        var a = cmp.get(actionName);
        if(actionParam) a.setParams(actionParam);
        a.setCallback(cmp, function(a){
            var returnValue = a.getReturnValue();
            cmp.getDef().getHelper().findAndSetText(cmp, "staticCounter", returnValue.Counter); 
            cmp.getDef().getHelper().findAndSetText(cmp, "responseData", returnValue.Data);
            cmp.getDef().getHelper().findAndSetText(cmp, "isFromStorage", a.isFromStorage());
            cmp.getDef().getHelper().findAndSetText(cmp, "callbackCounter", parseInt(cmp.find("callbackCounter").getElement().innerHTML,10)+1);
            if (extraCallback) {
                extraCallback(a);
            }
        });
        if(additionalProperties){
            additionalProperties(a);
        }
        $A.enqueueAction(a);
        return a;
    },
    findAndSetText:function(cmp, targetCmpId, msg){
        cmp.find(targetCmpId).getElement().innerHTML = msg;
    },
    
    // The sequential stages of testCacheExpiration
    testCacheExpirationStage1:function(cmp){
        $A.test.setTestTimeout(30000);
        this.resetCounter(cmp, "testCacheExpiration");
    },
    testCacheExpirationStage2:function(cmp){
        //Run the action and mark it as storable.
        var a = cmp.get("c.fetchDataRecord");
        a.setParams({testName : "testCacheExpiration"});
        a.setStorable();
        $A.test.enqueueAction(a);
        $A.test.addWaitFor(
            false,
            $A.test.isActionPending,
            function(){
                $A.test.assertFalse(a.isFromStorage(), "Failed to execute action at server");
                $A.test.assertEquals(0, a.getReturnValue().Counter, "Wrong counter value seen in response");
            }
        );
    },
    testCacheExpirationStage3:function(cmp){
        //Wait for atleast 5 seconds after the response has been stored
        $A.test.addWaitFor(true, function(){
                var now = new Date().getTime();
                var storageModifiedCmp = cmp.find("storageModified");
                if($A.util.isUndefinedOrNull(storageModifiedCmp)) {
                    storageModifiedCmp = cmp.getSuper().find("storageModified");
                }                    
                var storageModified = $A.test.getText(storageModifiedCmp.getElement());
                return ((now - parseInt(storageModified,10))/1000) > 5;
            });
    },
    testCacheExpirationStage4:function(cmp){
        // Run the action and verify that new response was fetched from server
        // Cause sweep by performing get after expired time in testCacheExpirationStage3
        $A.storageService.getStorage("actions").get("foo").then(function() {
            var aSecond = cmp.get("c.fetchDataRecord");
            aSecond.setParams({testName: "testCacheExpiration"});
            aSecond.setStorable();
            $A.test.enqueueAction(aSecond);
            $A.test.addWaitFor(
                "SUCCESS",
                function () {
                    return aSecond.getState()
                },
                function () {
                    $A.test.assertEquals(1, aSecond.getReturnValue().Counter, "aSecond response invalid.");
                    $A.test.assertFalse(aSecond.isFromStorage(), "expected cache expiration");
                }
            );
        });
    },
    
    // The sequential stages of testActionKeyOverloading
    testActionKeyOverloadingStage1:function(cmp){
        $A.test.setTestTimeout(30000);
        this.resetCounter(cmp, "testActionKeyOverloading");
    },
    testActionKeyOverloadingStage2:function(cmp){
        var a = cmp.get("c.substring");
        a.setParams({testName : "testActionKeyOverloading", param1 : 999});
        a.setStorable();
        $A.test.enqueueAction(a);
        $A.test.addWaitFor(false, $A.test.isActionPending,
            function(){
                $A.test.assertFalse(a.isFromStorage(), "Failed to excute action at server");
                $A.test.assertEquals(0, a.getReturnValue()[0], "Wrong counter value seen in response");
                $A.test.assertEquals(999, a.getReturnValue()[1]);
            });
    },
    testActionKeyOverloadingStage3:function(cmp){
        //Controller name is a substring of previous controller
        var a = cmp.get("c.string");
        a.setParams({testName : "testActionKeyOverloading", param1 : 999});
        a.setStorable();
        $A.test.enqueueAction(a);
        $A.test.addWaitFor(false, $A.test.isActionPending,
            function(){
                $A.test.assertFalse(a.isFromStorage(), "should not have fetched from cache");
                $A.test.assertEquals(1, a.getReturnValue()[0], "Wrong counter value seen in response");
                $A.test.assertEquals(999, a.getReturnValue()[1]);
            });
    },
    testActionKeyOverloadingStage4:function(cmp){
        //Controller name is the same as previous controller but different parameter value
        var a = cmp.get("c.string");
        a.setParams({testName : "testActionKeyOverloading", param1 : 9999});
        a.setStorable();
        $A.test.enqueueAction(a);
        $A.test.addWaitFor(false, $A.test.isActionPending,
            function(){
                $A.test.assertFalse(a.isFromStorage(), "Failed to excute action at server");
                $A.test.assertEquals(2, a.getReturnValue()[0], "Wrong counter value seen in response");
                $A.test.assertEquals(9999, a.getReturnValue()[1]);
            });
    },    
    
    // The sequential stages of testActionGrouping
    testActionGroupingStage1:function(cmp){
        $A.test.setTestTimeout(30000);
        this.resetCounter(cmp, "testActionGrouping_A");
        this.resetCounter(cmp, "testActionGrouping_B");
        this.resetCounter(cmp, "testActionGrouping_notStored");
    },
    testActionGroupingStage2:function(cmp){
        //2 Stored actions
        $A.run(function() {
                var a1 = cmp.get("c.substring");
                a1.setParams({testName : "testActionGrouping_A", param1 : 999});
                a1.setStorable();
                $A.enqueueAction(a1);
                var b1 = cmp.get("c.string");
                b1.setParams({testName : "testActionGrouping_B", param1 : 666});
                b1.setStorable();
                $A.enqueueAction(b1);
                //1 Unstored action
                var notStored = cmp.get("c.fetchDataRecord");
                notStored.setParams({testName : "testActionGrouping_notStored"});
                $A.enqueueAction(notStored);
            });
        $A.test.addWaitFor(false, $A.test.isActionPending);
    },
    testActionGroupingStage3:function(cmp){
        //Run a action whose response has been previously stored
        var a2 = cmp.get("c.substring");
        a2.setParams({testName : "testActionGrouping_A", param1 : 999});
        a2.setStorable();
        $A.test.enqueueAction(a2);
        $A.test.addWaitFor("SUCCESS", function(){return a2.getState()},
            function(){
                $A.log($A.storageService.getStorage("actions"));
                $A.test.assertTrue(a2.isFromStorage(), "Failed to fetch action from storage");
                $A.test.assertEquals(0, a2.getReturnValue()[0], "Wrong counter value seen in response");
                $A.test.assertEquals(999, a2.getReturnValue()[1]);
            });
    },
    testActionGroupingStage4:function(cmp){
            //Run a action whose response has been previously stored
        var b2 = cmp.get("c.string");
        b2.setParams({testName : "testActionGrouping_B", param1 : 666});
        b2.setStorable();
        $A.enqueueAction(b2);
        //Run a action which was previously not marked to be stored and group it with the one above
        var notStoredAgain = cmp.get("c.fetchDataRecord");
        notStoredAgain.setParams({testName : "testActionGrouping_notStored"});
        $A.test.enqueueAction(notStoredAgain);
        $A.test.addWaitFor("SUCCESS", function(){return b2.getState()},
            function(){
                $A.test.assertTrue(b2.isFromStorage(), "failed to fetch action from cache");
                $A.test.assertEquals(0, b2.getReturnValue()[0], "Wrong counter value seen in response");
                $A.test.assertEquals(666, b2.getReturnValue()[1]);
            });
        $A.test.addWaitFor(false, $A.test.isActionPending,
            function(){
                $A.test.assertFalse(notStoredAgain.isFromStorage(), "Failed to group stored actions and unstored actions.");
                $A.test.assertEquals(1, notStoredAgain.getReturnValue().Counter, 
                    "Counter value should have been incremented for unstored action");
                });
    }
})
