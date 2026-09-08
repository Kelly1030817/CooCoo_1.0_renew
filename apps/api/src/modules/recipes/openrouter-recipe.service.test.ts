import { describe,expect,test } from "bun:test";
import { buildRecipePrompt, generateRecipe } from "./openrouter-recipe.service";
import { brandSafeRecipes } from "@coocoo/core";

describe("recipe safety fallback",()=>{
  test("labels a valid generated result as OpenRouter and keeps its billed cost",async()=>{const previous=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY="test";try{const recipe=structuredClone(brandSafeRecipes.find(item=>item.title==="胡麻雞絲拌麵")!);const result=await generateRecipe({style:"家常",ingredientNames:[],restrictions:[],cookware:[{type:"電磁爐",capacity:null,limitations:[]}],budget:100,energyLevel:"normal",inventory:[]},{generate:async()=>({value:recipe,model:"test-model",costUsd:.01})});expect(result).toMatchObject({source:"openrouter",aiAttempted:true,costUsd:.01,model:"test-model"})}finally{if(previous===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=previous}})
  test("uses a complete reviewed package without returning a fake AI result",async()=>{const previous=process.env.OPENROUTER_API_KEY;delete process.env.OPENROUTER_API_KEY;try{const result=await generateRecipe({style:"家常",ingredientNames:[],restrictions:[{id:"egg",label:"蛋過敏",kind:"allergy",ingredientKeys:["蛋"],isHardLimit:true}],cookware:[{type:"電磁爐",capacity:null,limitations:[]}],budget:100,energyLevel:"normal",inventory:[]});expect(result.source).toBe("brand_safe");expect(result.recipe.title).toBe("胡麻雞絲拌麵");expect(result.recipe.cookwareTypes).toEqual(["電磁爐"]);expect(result.recipe.ingredients.find(item=>item.ingredientKey==="雞肉")).toMatchObject({quantity:120,unit:"克"});expect(result.recipe.steps[0].timerSeconds).toBe(600)}finally{if(previous)process.env.OPENROUTER_API_KEY=previous}})
  test("fails closed when cookware makes every recipe unavailable",async()=>{const previous=process.env.OPENROUTER_API_KEY;delete process.env.OPENROUTER_API_KEY;try{expect(generateRecipe({style:"家常",ingredientNames:[],restrictions:[],cookware:[{type:"微波爐",capacity:null,limitations:[]}],budget:100,energyLevel:"normal",inventory:[]})).rejects.toThrow("NO_SAFE_RECIPE_AVAILABLE")}finally{if(previous)process.env.OPENROUTER_API_KEY=previous}})
  test("asks the model to infer custom cookware capabilities conservatively",()=>{
    const prompt=buildRecipePrompt({style:"家常",ingredientNames:["雞蛋"],restrictions:[],cookware:[{type:"多功能快煮鍋",capacity:"1.5L",limitations:["不可油炸"]}],budget:100,energyLevel:"normal",inventory:[]});
    expect(prompt).toContain("多功能快煮鍋");
    expect(prompt).toContain("1.5L");
    expect(prompt).toContain("不可油炸");
    expect(prompt).toContain("保守推斷");
    expect(prompt).toContain("不得假設");
  })
})
