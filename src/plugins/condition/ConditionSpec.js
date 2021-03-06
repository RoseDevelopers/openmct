/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import Condition from "./Condition";
import {TRIGGER} from "./utils/constants";
import TelemetryCriterion from "./criterion/TelemetryCriterion";

let openmct = {},
    testConditionDefinition,
    testTelemetryObject,
    conditionObj,
    conditionManager,
    mockTelemetryReceived,
    mockTimeSystems;

describe("The condition", function () {

    beforeEach (() => {
        conditionManager = jasmine.createSpyObj('conditionManager',
            ['on']
        );
        mockTelemetryReceived = jasmine.createSpy('listener');
        conditionManager.on('telemetryReceived', mockTelemetryReceived);

        testTelemetryObject = {
            identifier:{ namespace: "", key: "test-object"},
            type: "test-object",
            name: "Test Object",
            telemetry: {
                values: [{
                    key: "some-key",
                    name: "Some attribute",
                    hints: {
                        domain: 1
                    }
                }, {
                    key: "some-other-key",
                    name: "Another attribute",
                    hints: {
                        range: 1
                    }
                }]
            }
        };
        conditionManager.telemetryObjects = {
            "test-object": testTelemetryObject
        };
        openmct.objects = jasmine.createSpyObj('objects', ['get', 'makeKeyString']);
        openmct.objects.get.and.returnValue(new Promise(function (resolve, reject) {
            resolve(testTelemetryObject);
        }));        openmct.objects.makeKeyString.and.returnValue(testTelemetryObject.identifier.key);
        openmct.telemetry = jasmine.createSpyObj('telemetry', ['isTelemetryObject', 'subscribe', 'getMetadata']);
        openmct.telemetry.isTelemetryObject.and.returnValue(true);
        openmct.telemetry.subscribe.and.returnValue(function () {});
        openmct.telemetry.getMetadata.and.returnValue(testTelemetryObject.telemetry.values);

        mockTimeSystems = {
            key: 'utc'
        };
        openmct.time = jasmine.createSpyObj('time', ['getAllTimeSystems']);
        openmct.time.getAllTimeSystems.and.returnValue([mockTimeSystems]);

        testConditionDefinition = {
            id: '123-456',
            configuration: {
                name: 'mock condition',
                output: 'mock output',
                trigger: TRIGGER.ANY,
                criteria: [
                    {
                        id: '1234-5678-9999-0000',
                        operation: 'equalTo',
                        input: ['0'],
                        metadata: 'value',
                        telemetry: testTelemetryObject.identifier
                    }
                ]
            }
        };

        conditionObj = new Condition(
            testConditionDefinition,
            openmct,
            conditionManager
        );
    });

    it("generates criteria with the correct properties", function () {
        const testCriterion = testConditionDefinition.configuration.criteria[0];
        let criterion = conditionObj.generateCriterion(testCriterion);
        expect(criterion.id).toBeDefined();
        expect(criterion.operation).toEqual(testCriterion.operation);
        expect(criterion.input).toEqual(testCriterion.input);
        expect(criterion.metadata).toEqual(testCriterion.metadata);
        expect(criterion.telemetry).toEqual(testCriterion.telemetry);
    });

    it("initializes with an id", function () {
        expect(conditionObj.id).toBeDefined();
    });

    it("initializes with criteria from the condition definition", function () {
        expect(conditionObj.criteria.length).toEqual(1);
        let criterion = conditionObj.criteria[0];
        expect(criterion instanceof TelemetryCriterion).toBeTrue();
        expect(criterion.operator).toEqual(testConditionDefinition.configuration.criteria[0].operator);
        expect(criterion.input).toEqual(testConditionDefinition.configuration.criteria[0].input);
        expect(criterion.metadata).toEqual(testConditionDefinition.configuration.criteria[0].metadata);
    });

    it("initializes with the trigger from the condition definition", function () {
        expect(conditionObj.trigger).toEqual(testConditionDefinition.configuration.trigger);
    });

    it("destroys all criteria for a condition", function () {
        const result = conditionObj.destroyCriteria();
        expect(result).toBeTrue();
        expect(conditionObj.criteria.length).toEqual(0);
    });
});
