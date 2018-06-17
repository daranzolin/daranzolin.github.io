---
layout: post
title:  "Elected Official Lookup with R, rcicero"
date:   2016-11-04 07:45:02 -0700
categories: Tutorial
tags: R politics rcicero
---

Chances are that you now hate politics. "E-mails" makes you perspire, and every Halloween pumpkin bore an eerie resemblance to the Republican nominee.
So why not channel that hate into something productive, like building interactive web applications and/or learning more about your elected officials?
In other words, why not make cool stuff with R?

[The Cicero folk recently linked to their elected official locator,](https://live.cicerodata.com/?utm_content=buffer842a7&utm_medium=social&utm_source=twitter.com&utm_campaign=buffer)
but it only goes live after election day. In the meantime, we can build our own locator with `rcicero` and `shiny`.  

<!--more-->

The following application is included in `rcicero` by calling `explore_cicero()`. It is admittedly an ersatz approximation of
other, more elegant locators, but what it lacks in beauty it makes up for in content. `explore_cicero()` gives you each 
elected official's:

1. Office addresses
2. Social media accounts (e.g. Twitter, Flickr, Facebook etc.)
3. Party
4. Phone and Fax numbers
5. Biography
6. Official portrait

In sum, no other tool allows you to judge your elected official's education, career decisions, social media presence, and
personal appearance with just a few clicks. You're welcome, trolls. Code below:

```
library(rcicero)
library(shiny)
library(leaflet)
set_token_and_user("your_cicero_account_email_address", "your_cicero_password")

explore_cicero <- function() {
  
  ui <- fluidPage(
    titlePanel("Elected Official Lookup"),
    fluidRow(
      sidebarPanel(
        textInput("search_loc", "Address"),
        selectInput("district_type", "District Type", choices = list("National Upper",
                                                                     "National Lower",
                                                                     "State Upper",
                                                                     "State Lower")
        ),
        actionButton("button", "Search", icon("cog"))
      ),
      column(
        4,
        leafletOutput("map", height = 600)
      ),
      column(
        4,
        tabsetPanel(
          tabPanel("General Info", tableOutput("gen_info")),
          tabPanel("Identifiers", tableOutput("ids")),
          tabPanel("Address Info", tableOutput("address_info")),
          tabPanel("District Info", tableOutput("district_info")),
          tabPanel("Bio", textOutput("notes")),
          tabPanel("Image", htmlOutput("image"))
        )
      )
    )
  )
  
  server <- function(input, output, session, ...) {
    
    cicero_data <- eventReactive(input$button, {
      
      district_type <- switch(input$district_type,
                              "National Upper" = "NATIONAL_UPPER",
                              "Nationl Lower" = "NATIONAL_LOWER",
                              "State Upper" = "STATE_UPPER",
                              "State Lower" = "STATE_LOWER")
      rcicero::get_official(search_loc = input$search_loc, district_type = district_type)
    })
    
    output$map <- renderLeaflet({
      
      leaflet(cicero_data()$gen_info) %>% addTiles() %>%
        addMarkers(~lon, ~lat, popup = ~sprintf("%s %s, %s", first_name, last_name, party))
    })
    
    output$gen_info <- renderTable({
      cicero_data()$gen_info %>%
        dplyr::select(-notes)
    })
    
    output$ids <- renderTable({
      cicero_data()$identifiers
    })
    
    output$address_info <- renderTable({
      cicero_data()$address_info
    })
    
    output$district_info <- renderTable({
      cicero_data()$district_info
    })
    
    output$notes <- renderText({
      cicero_data()$gen_info$notes
    })
    
    output$image = renderUI({
      src = cicero_data()$gen_info$photo_url
      tags$img(src=src)
    })
    
  }
  shinyApp(ui, server)
}
explore_cicero()
```
