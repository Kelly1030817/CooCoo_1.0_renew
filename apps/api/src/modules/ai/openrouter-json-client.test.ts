import { describe,expect,test } from "bun:test";
import { Type } from "@sinclair/typebox";
import { OpenRouterJsonClient } from "./openrouter-json-client";

describe("OpenRouter structured client",()=>{
  test("sends strict privacy, schema, image and usage controls",async()=>{
    let request:RequestInit|undefined;
    const fetcher=(async(_url:string|URL|Request,init?:RequestInit)=>{request=init;return new Response(JSON.stringify({model:"test-model",choices:[{message:{content:'{"ok":true}'}}],usage:{cost:.01,prompt_tokens:10,completion_tokens:2}}),{status:200,headers:{"content-type":"application/json"}})}) as typeof fetch;
    const result=await new OpenRouterJsonClient("secret","test-model",fetcher).generate<{ok:boolean}>({system:"system",prompt:"prompt",schema:Type.Object({ok:Type.Boolean()}),schemaName:"test",image:{bytes:new Uint8Array([1,2]),mimeType:"image/png"},requireZeroDataRetention:true,maxTokens:64});
    const body=JSON.parse(String(request?.body));
    expect(body.provider).toEqual({allow_fallbacks:false,require_parameters:true,data_collection:"deny",zdr:true});
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.messages[1].content[0].image_url.url).toStartWith("data:image/png;base64,");
    expect(body.max_tokens).toBe(64);expect(result).toMatchObject({value:{ok:true},model:"test-model",costUsd:.01,inputTokens:10,outputTokens:2});
  });
});
