import { sayHelloType } from "./types";

export function sayHello({firstname, lastname}:sayHelloType){
    console.log(firstname+"+"+lastname);
    console.log("hi")
}