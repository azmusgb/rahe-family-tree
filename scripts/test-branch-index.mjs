import test from'node:test';
import assert from'node:assert/strict';
import{buildBranchIndex,recordMatchesBranch,recordBranches}from'../branch-index.js';

const people=[{id:'P1',name:'Alice Ferry',branch:'Ferry'},{id:'P2',name:'Bob Rahe',branch:'Rahe'},{id:'P3',name:'Carol',branch:'Rahe'}];
const relationships=[{id:'R1',from:'P1',to:'P2',type:'spouse'},{id:'R2',from:'P2',to:'P3',type:'parent-child'}];
const claims=[{id:'C1',claim:'A claim whose prose happens to mention Ferry',state:'SUPPORTED',relationshipIds:['R2']},{id:'C2',claim:'Connected Ferry claim',state:'SUPPORTED',relationshipIds:['R1']}];
const sources=[{id:'W001',name:'Source one',claimIds:['C1'],relationshipIds:[]},{id:'W002',name:'Source two',claimIds:['C2'],relationshipIds:['R1']}];
const tasks=[{id:'T1',record:'Ferry target',branch:'Ferry'},{id:'T2',record:'Other target',branch:'Rahe'}];
const events=[{eventId:'EV1',personIds:['P1'],claimIds:[],sourceIds:[],sourceLocation:{section:'S3'}},{eventId:'EV2',personIds:[],claimIds:['C1'],sourceIds:['W001'],sourceLocation:{section:'S4'}}];
const familyGroups=[{id:'FG1',branch:'Rahe',spouseIds:['P2','P3'],childIds:[]}];
const corpus={sections:[{id:'S1'},{id:'S2'},{id:'S3'},{id:'S4'}]};
claims[0].location={section:'S1'};claims[1].location={section:'S2'};
const model={claims,sources,researchTasks:tasks,normalizedEvents:events,branchSummaries:[{name:'Ferry'},{name:'Rahe'}]};
const index=buildBranchIndex({model,corpus,people,relationships,familyGroups});

test('people match explicit branches only',()=>{assert.equal(recordMatchesBranch(index,people[0],'Ferry'),true);assert.equal(recordMatchesBranch(index,people[0],'Rahe'),false);});
test('relationship branches derive from connected endpoints',()=>{assert.deepEqual(new Set(recordBranches(index,relationships[0])),new Set(['Ferry','Rahe']));});
test('claim prose does not create a false branch match',()=>{assert.equal(recordMatchesBranch(index,claims[0],'Ferry'),false);assert.equal(recordMatchesBranch(index,claims[0],'Rahe'),true);});
test('claim and source inherit branches through explicit relationship/source crosswalks',()=>{assert.equal(recordMatchesBranch(index,claims[1],'Ferry'),true);assert.equal(recordMatchesBranch(index,sources[1],'Ferry'),true);});
test('research task branch remains explicit',()=>{assert.equal(recordMatchesBranch(index,tasks[0],'Ferry'),true);assert.equal(recordMatchesBranch(index,tasks[0],'Rahe'),false);});
test('timeline events inherit branch from linked people claims and sources',()=>{assert.equal(recordMatchesBranch(index,events[0],'Ferry'),true);assert.equal(recordMatchesBranch(index,events[0],'Rahe'),false);assert.equal(recordMatchesBranch(index,events[1],'Rahe'),true);assert.equal(recordMatchesBranch(index,events[1],'Ferry'),false);});
test('archive section inherits branch from linked entity location',()=>{assert.equal(recordMatchesBranch(index,corpus.sections[0],'Rahe'),true);assert.equal(recordMatchesBranch(index,corpus.sections[0],'Ferry'),false);assert.equal(recordMatchesBranch(index,corpus.sections[1],'Ferry'),true);assert.equal(recordMatchesBranch(index,corpus.sections[2],'Ferry'),true);assert.equal(recordMatchesBranch(index,corpus.sections[3],'Rahe'),true);});
