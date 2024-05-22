import { sayHelloType } from "./types";

export function sayHello({firstname, lastname}:sayHelloType){
    console.log(firstname+"+"+lastname);
    console.log(process.env.MY_ENV_VAR)
}