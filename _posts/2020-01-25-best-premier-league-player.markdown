---
layout: post
title:  "Who's the best player to sign in the Premier League?"
date:   2020-01-25 13:15:02 -0700
categories: Post
tags: R
image: "/img/blog/best-premier-league.png"
---

The purpose of this post is threefold: (1) to answer the question, "Who's the best player that's moved to the Premier League, 
*at the time of signing*?";[^1] (2) to convince Ryan O'Hanlon to abandon Google Sheets in favor of R; and (3) to dismay fellow United fans
everywhere.

[^1]: This excludes players like Christiano Ronaldo, who has since become one of the five best players ever, but was only good at moving when he arrived at Manchester United as a teenager.

<!--more-->

O'Hanlon [posed this question on his excellent podcast last week.](https://nograssintheclouds.substack.com/p/episode-16-does-the-premier-league) 
Can you find one player who was considered top-5 in the world *when* they signed for a Premier League club? Difficult to say. In the group chat, 
my friends and I ventured some candidates: Michael Ballack, Andriy Shevchenko, Fernando Torres, Eric Cantona, Dennis Bergkamp, Paul Pogba, etc. Most of these players' primes, however, were either behind or before them.[^2] 

[^2]: O'Hanlon's explanation is that there are now basically three clubs (Madrid, Barca, and PSG) that can outbid everyone else for the best of the best.

For a more precise approach, I suggested we tally each player's FIFA rating the year they signed with their Premier League club. And 
while I often take umbrage with FIFA's appraisals, it's a relatively unbiased approach. 

I now needed two sets of data: Premier League signings and FIFA ratings. The former is [available on Wikipedia](https://en.wikipedia.org/wiki/List_of_foreign_Premier_League_players), and 
I found the latter [in a GitHub repository.](https://github.com/kafagy/fifa-FUT-Data) Sadly, the ratings data only goes back to FIFA 10, so 
I'm settling for a mere decade of data.

Packages used for ths blog:

{% highlight r %}
library(rvest)
library(stringr)
library(glue)
library(patchwork)
library(tidyverse)
{% endhighlight %}

## Cleaning the Transfer Data

After reading the url, this required some string manipulation via regex:

{% highlight r %}
wiki_foreign_players_url <- "https://en.wikipedia.org/wiki/List_of_foreign_Premier_League_players"
foreign_players <- read_html(wiki_foreign_players_url) %>% 
  html_nodes("h2+ ul li , .tright+ ul li") %>% 
  html_text()

names <- str_extract_all(foreign_players,"^.*?(?= [–—])")
teams <- str_extract_all(foreign_players, "(?<=– ).+(?= –)")
years <- str_extract_all(foreign_players, "\\d{4}") 
{% endhighlight %}

Footballers have journeymen, roundabout careers ill-expressed by a single `<li>` on Wikipedia. They can leave the Premier League and return multiple times, sometimes playing for multiple clubs each time. They can play for multiple clubs in a single year. This complicated the 
'rectangling' process, since I wanted to preserve a row each time they returned. 

{% highlight r %}
post_2010_inds <- map_lgl(years, ~!any(1900:2009 %in% .x[[1]]))
players <- tibble(
  NAME = names[post_2010_inds],
  CLUB = teams[post_2010_inds],
  YEAR = years[post_2010_inds]
) %>% 
  unnest(c(NAME, YEAR, CLUB), keep_empty = TRUE) %>% 
  separate_rows(CLUB, sep = ",", convert = TRUE) %>% 
  mutate_all(str_trim) %>% 
  group_by(NAME) %>%
  filter(row_number() %in% c(1, n())) %>% 
  ungroup() %>% 
  group_by(NAME, YEAR) %>% 
  summarize(CLUB = c(CLUB)[1]) %>% 
  mutate(YEAR = as.numeric(YEAR) - 2000) 

players
# A tibble: 971 x 3
   NAME                YEAR CLUB                  
   <chr>              <dbl> <chr>                 
 1 Aaron Connolly        19 Brighton & Hove Albion
 2 Aaron Mooy            17 Huddersfield Town     
 3 Abdelhamid Sabiri     17 Huddersfield Town     
 4 Abdoulaye Doucouré    16 Watford               
 5 Abdul Razak           10 Manchester City       
 6 Abel Hernández        14 Hull City             
 7 Abel Hernández        16 Hull City             
 8 Aboubakar Kamara      18 Fulham                
 9 Ádám Bogdán           10 Bolton Wanderers      
10 Ádám Bogdán           15 Liverpool             
# … with 961 more rows
{% endhighlight %}

`players` now has each player's name, their club, and the year(s) they arrived.

## Cleaning the FIFA Ratings Data

The ratings data is thankfully cleaner. 



{% highlight r %}
system("git clone https://github.com/kafagy/fifa-FUT-Data.git fifa-ratings")
files <- dir("fifa-ratings", "FIFA\\d{2}\\.csv$", full.names = TRUE)
file_years <- str_extract_all(files, "\\d{2}")

ratings <- map2_dfr(files, file_years, ~{
  read_csv(.x) %>% 
    mutate(YEAR = as.numeric(.y)) %>% 
    select(NAME, RATING, YEAR)
  })

ratings
# A tibble: 148,027 x 3
   NAME              RATING  YEAR
   <chr>              <dbl> <dbl>
 1 Lionel Messi          95    10
 2 Lionel Messi          94    10
 3 David Villa           93    10
 4 Cristiano Ronaldo     93    10
 5 Maicon                92    10
 6 Wayne Rooney          92    10
 7 David Villa           92    10
 8 Fernando Torres       92    10
 9 Puyol                 91    10
10 Carlos Tévez          91    10
# … with 148,017 more rows
{% endhighlight %}

FIFA ratings can fluctuate during the year, and this particular dataset preserves each unique rating. Messi, for example, apparently
bounced between 95 and 94 during the 2010-11 season. Which is the 'correct' rating? Should I take the max? The mean? After reviewing some of
the results, I settled on the min. 

{% highlight r %}
plot_data <- left_join(players, ratings, by = c("NAME", "YEAR")) %>% 
  group_by(NAME, CLUB, YEAR) %>% 
  slice(which.min(RATING)) %>% 
  ungroup() %>% 
  transmute(
    NAME,
    CLUB,
    LABEL = glue("{NAME} to {CLUB} (20{YEAR})"),
    RATING
    )

plot_data
# A tibble: 690 x 4
   NAME               CLUB              LABEL                     RATING
   <chr>              <chr>             <glue>                     <dbl>
 1 Aaron Mooy         Huddersfield Town Aaron Mooy (2017)             76
 2 Abdoulaye Doucouré Watford           Abdoulaye Doucouré (2016)     73
 3 Abdoulaye Faye     Hull City         Abdoulaye Faye (2013)         70
 4 Abel Hernández     Hull City         Abel Hernández (2014)         72
 5 Abel Hernández     Hull City         Abel Hernández (2016)         74
 6 Aboubakar Kamara   Fulham            Aboubakar Kamara (2018)       69
 7 Adam Masina        Watford           Adam Masina (2018)            74
 8 Adam Mitchell      Sunderland        Adam Mitchell (2012)          54
 9 Adama Diakhaby     Huddersfield Town Adama Diakhaby (2018)         70
10 Adama Traoré       Aston Villa       Adama Traoré (2015)           63
# … with 680 more rows
{% endhighlight %}

Ok! Now we can finally answer! 

{% highlight r %}
plot_data %>% 
  top_n(10, RATING) %>% 
  ggplot(aes(reorder(NAME, RATING), RATING)) +
  geom_bar(stat = "identity", fill = "steelblue", width = .7) +
  geom_text(stat = "identity", aes(label = LABEL, y = 0), hjust = 0, nudge_y = 2, color = "white") +
  geom_text(stat = "identity", aes(label = RATING), nudge_y = 2, color = "firebrick") +
  labs(
    title = "Who's the best player to move to the Premier League?",
    subtitle = "2010-2020",
    x = NULL,
    y = NULL,
    caption = "Source: https://github.com/kafagy/fifa-FUT-Data"
  ) +
  coord_flip() +
  hrbrthemes::theme_ipsum() +
  theme(
    axis.text.x = element_blank(),
    axis.ticks.x = element_blank(),
    axis.text.y = element_blank(),
    axis.ticks.y = element_blank(),
    panel.grid.major.x = element_blank(),
    panel.grid.minor.x = element_blank(),
    panel.grid.major.y = element_blank()
  ) 
{% endhighlight %}

<img src="/img/blog/best-premier-league.png" alt="bestprem" align="center"/> 

Who else but the Zlatan? Sadly, here's Manchester United buying *five* of the alleged best eight players to move to the Premier League over the last 10 years and having little to show for it. Falcao and Di Maria were busts, Schweinsteiger was in no way an 88 by that point, Pogba's on his way out, and Ibrahimovic was already coming out of his prime (although he did enjoy one good season there).

It is interesting that no player with a rating in the 90s has moved to the richest league in the world. To be fair, however, there aren't many players of that quality. I can only think of four 90s players that switched leagues in the last few years: Hazard to Madrid, Suarez to Barca, Neymar to PSG, and Ronaldo to Juve.

Aside: Down with the Glazers and Woodward!





