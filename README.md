
# ambrosia.ai

Commit To Change: An AI Agents Hackathon

ambrosia.ai is a meal planning assistant that helps users eat nutritiously while staying within their food budget and automatically building savings. 


## Features

- Optimised weekly meal plans and grocery lists
- Optimises spending by combining real-time grocery pricing data 
- Light/dark mode 

## Stuff to remember now

Find postcode -> if choose eat out -> find restaurants nearby else find supermarkets -> find cheapest meal for restaurants (groceries for supermarket) -> calculate nutrition -> put it in calendar with total spending that is within budget

eating everyday is not possible if budget too low, gonna advice user to switch to cooking and also make a plan for only eat outside on specific time. 


How it works:

1, after user entered preferences, our web app will use nearby search to find restaurants near user, and it will list it based on gemini analyse on google place details (new) responses (user rating and reviews), food menu (to see if it fits user preferences and with good nutrition), then send the result to user with restaurant info (complete address, phone number and photo using place photo (new)), if user accepted it it will then be saved to 

These look useful:
https://developers.google.com/maps/documentation/javascript/nearby-search
https://developers.google.com/maps/documentation/places/web-service/nearby-search

## AI Observability 

We used Opik to monitor our agent for AI observability.

## Deployment

To deploy this project run

```bash
  docker compose up --build 
```

## Authors

- [@Karso2023](https://www.github.com/Karso2023)
- [@RyanT04](https://www.github.com/RyanT04)


## License

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)


