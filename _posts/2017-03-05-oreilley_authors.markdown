---
layout: post
title:  "How to be an O'Reilley Author"
date:   2017-03-05 21:27:02 -0700
categories: Post
tags: R scraping
---

Earlier today I fantasized about publishing a book through [O'Reilley Media.](https://www.oreilly.com/) Besides producing dozens of essential
works on programming, data science, and UX, they're the ones responsible for introducing IT folk to the African Civit, the Binturong, 
and my persona favorite, the Springhaas. Would zoology textbooks with terminal prompts and monitors be half as interesting? I doubt it.

The fantasy ended abruptly, as I remembered that I had a B.A. in English instead of a B.S. in Computer Science, and an M.T.S. instead of an
MSci. I also assumed that the vast majority of O'Reilley authors hold terminal degrees in their respective fields. But...was 
that a safe assumption? I went to find out.

<!--more-->

### Getting the Author Profiles

I hoped that O'Reilley had author profiles available somewhere on their website, and I was not disappointed. All that remained was a dash
of web scraping. Before getting started, I'd like to assure my readers that I checked O'Reilley's [Terms of Service](http://www.oreilly.com/terms/index.html)
before writing a line of code. I control-f'd my way through the terms, and nowhere could I find a prohibition against scraping.

My plan was this: (1) scrape each author's bio, twitter handle, and expertises from their author profile; (2) coerce them into a data frame; and
(3) grep for whatever--"PhD", "CEO", "Founder", etc. My scraping function is below:[^1]

{% highlight r %}

library(tidyverse)
library(rvest)
library(httr)
library(stringr)

get_oreilly_author_details <- function(id) {
  BASE_URL <- "http://www.oreilly.com"
  url <- modify_url(BASE_URL, path = c("pub", "au", id))
  resp <- GET(url)
  
  if (resp$status_code != 200) {
    tibble(id = id, bio = NA, twitter = NA, expertises = NA)
  } else {
    
    html_doc <- resp %>% 
      content("text") %>% 
      read_html()
    
    scrape_text <- function(html_doc, nodes) {
      for (node in nodes) {
        text <- html_doc %>% 
            html_nodes(node) %>% 
            html_text() %>% 
            as.character()
        if (!length(text) < 1) break
      }
      if (length(text) < 1) NA else text
    }
    
    tibble(
      id = id,
      bio = scrape_text(html_doc, c(".authorbio", "#Biography p")),
      twitter = scrape_text(html_doc, "#authordetails li+ li a"),
      expertises = list(str_trim(scrape_text(html_doc, ".expertise li")))
    )
  }
}

{% endhighlight %}

With our scraping function in hand, we just iterate through a vector of author ids. Author ids are assigned chronologically, 7290 being the
most recent. Here I figured the last 290 authors would be a decent sample size:

{% highlight r %}

oreilley_authors <- 7000:7290 %>% 
  map_df(get_oreilly_author_details)

{% endhighlight %}

### O'Reilley Author Bios

I'd like to apologize to the O'Reilley authors in advance. While I'm about to attempt a generalization of your past and present identities,
I acknowledge and respect your individuality--you are irreducible.

With that out of way, let's learn who these authors are. 

**Of the 290 authors represented, how many have PhDs?"**

 {% highlight r %}
 
> oreilley_authors %>% 
   filter(!is.na(bio)) %>%  #18 authors do not have bios
   mutate(phd = ifelse(grepl("phd", bio, ignore.case = TRUE), TRUE, FALSE)) %>% 
   count(phd)
   
 {% endhighlight %}

```
# A tibble: 2 × 2
    phd     n
  <lgl> <int>
1 FALSE   257
2  TRUE    19

```

Wow, not what I was expecting! "PhD" appears in a *mere 7%* of the more recent O'Reilley author bios. I concede it's possible that many authors
didn't bother mentioning it, but that seems unlikely. 

Using the same approach, I learned:

* 18 percent are CEOs
* 10 percent are founders
* 4 percent are presidents
* 6 percent are "passionate" or have "passion"

Again it's very possible that there are dozens more CEOs, founders, and presidents among the O'Reilley authors, but it's odd they wouldn't include
those tidbits in their bios. This is good news! You don't have to have a PhD, be a CEO, found an organization, or be president to be an
O'Reilley author!

Out of curiosity, what are the most common words in O'Reilley bios? 

{% highlight r %}

bio_words <- oreilley_authors %>% 
  filter(!is.na(bio)) %>%
  select(bio) %>% 
  unnest_tokens(word, bio) 

data("stop_words")

bio_words %>%
  anti_join(stop_words) %>% 
  count(word, sort = TRUE)
  
{% endhighlight %}

```

# A tibble: 3,976 × 2
          word     n
         <chr> <int>
1         data   181
2     software   129
3   university    89
4      science    88
5   experience    77
6   technology    73
7       design    71
8  development    70
9      product    70
10    security    69
# ... with 3,966 more rows

```

No surprises.

### O'Reilley Author Expertises

Let's shift focus from the bios to the expertises. Sure you don't have to slog through years of school and debt for that doctorate, but you
better be an expert in something. Here are the most common expertises:

{% highlight r %}

oreilley_authors %>% 
  unnest(expertises) %>% 
  mutate(expertises = tolower(expertises)) %>% 
  count(expertises, sort = TRUE)

{% endhighlight %}

```

# A tibble: 257 × 2
         expertises     n
              <chr> <int>
1          speaking    48
2          training    44
3        consulting    34
4           writing    29
5       programming    15
6        javascript     5
7      data science     4
8            hadoop     4
9              java     4
10 machine learning     4
# ... with 247 more rows

```

The news keeps getting better! You don't even have to be an expert in *writing* to publish a book! Only 40% of these authors claim
writing as an expertise. 

### Conclusion

To sum up, *the "average" O'Reilley author does not have their PhD, is not a president or CEO, and is not even an expert writer!* You don't need to be those things either--let that be your inspiration. 

[^1]: Sometime ago, O'Reilley changed the CSS biography selector from "#Biography p" to ".authorbio". When exactly that occurred is unknown, but I had to account for the presence of both selectors.

