import errorResponseSchema from '../../../../core/schema/errorSchema.js';
const id = {type: 'integer', minimum: 1};
const identity = {service_id:id,module:{type:'string'},action:{type:'string'}};
const page = (items: object) => ({200:{type:'object',additionalProperties:false,required:['permission','count','ok'],properties:{permission:{type:'array',items},count:{type:'integer',minimum:0},ok:{type:'boolean'}}},...errorResponseSchema});
export const catalogResponse = page({type:'object',additionalProperties:false,required:['id','service_id','module','action'],properties:{id,...identity}});
export const roleGrantsResponse = page({type:'object',additionalProperties:false,required:['permission_action_id','role_id','service_id','module','action','allowed'],properties:{permission_action_id:id,role_id:id,...identity,allowed:{type:'boolean'}}});
export const effectiveResponse = {200:{type:'object',additionalProperties:false,required:['permissions','ok'],properties:{permissions:{type:'array',items:{type:'object',additionalProperties:false,required:['service_id','module','actions'],properties:{service_id:id,module:{type:'string'},actions:{type:'array',items:{type:'string'}}}}},ok:{type:'boolean'}}},...errorResponseSchema};

export const grantUpdateResponse = {204:{type:"null"},...errorResponseSchema,409:{...errorResponseSchema[400],description:"Permission integrity conflict"}};
