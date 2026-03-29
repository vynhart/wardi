# Online store for whatsapp seller

This is a mobile web for seller who sells their product
in Whatsapp.

## Type of users on the system
- Seller: those who want to create store page to sell
    their products.
- Buyer: those who want to see the list of products
    of a seller and to check out.

## Purpose 

The purpose of this system is so that seller
can show the catalog of their products, accept order and
automatically manage the stocks of the product (decreased 
when order is accepted).

Seller will share the link to their store so that buyer
can browse the catalog, add product to cart, and checkout.

## Store context

North star: each seller "own" their store page. User who
landed on their store page would feel as if it's a completely
isolated system, owned by the store owner.

Whenever a user landed on a store page, they use the
system within the context of that store. Meaning that
they can only see the product of that store, their order on
that store, and so on. They shouldn't be able to see their
order from different store.

# Tech stack

The application is built on top of HTML and CSS with
Vue framework for javascripts.

## Backend

It's a "serverless" web application, we'll use Google
Firebase stacks to run it.

## Deployment environment

There must be two environment for deployment:
staging and production. These two environment exists
on different firebase project.

## Application screens

The draft of applications screens is written in each
Markdown file in this directory with suffix `-page.md`.
With the initial HTML design written in the `-draft.html`.

# Development Direction

Each `-draft.html` is a stand alone files, during the
implementation, we should optimize the component usage
when possible.