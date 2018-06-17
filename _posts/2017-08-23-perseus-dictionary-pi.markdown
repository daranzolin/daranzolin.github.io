---
layout: post
title:  "The Perseus Dictionary, Part I"
date:   2017-08-23 21:27:02 -0700
categories: Post
tags: R 
---

One of my favorite episodes of *Black Adder* is "Ink and Incapability". The plot is this: Samuel Johnson is 
soliciting patronage from Prince George for his new book, the first ever English dictionary. But due to Black Adder's petty
jealousy, Johnson's dictionary is instead burned through a hilarous turn of events. The burning of the dictionary represented a
catastrophic loss of scholarship, maybe akin to us losing all of Wikipedia, the *Encyclopedia Brittanica,* and basketball-reference.com now. Black Adder must then rewrite the dictionary, proceeding linearly, alphabetically, and manually. For over 300 years, 
this was how we used dictionaries. But with the advent of computing, we can now scour a dictionary much more creatively.

<!--more-->

In this post, I will show how I obtained *A Dictionary of Greek and Roman Biography and Mythology* by William Smith, LLD, ed. 1890. It's
an old dictionary, but it was the authoritative source of the Classical World for the Victorians. Whatever Jules Verne thought 
of the Roman senate, he probably learned it here. And thanks to the heroes at the Perseus Digital Library, every entry is available online.

[Each entry is listed here.](http://cts.perseids.org/read/pdlrefwk/viaf88890045/003/perseus-eng1) There are over 19,000 of them,
so we need to an efficient way to bring them into R. [Thanks to my previous work on rperseus,](https://github.com/daranzolin/rperseus) I have a pretty good idea of Perseus'
API end points. I originally tried to pass the URN to `rperseus::get_perseus_text`, but only the 'A' entries were returned. We need them all.

Via the API, you can append an index range to any URN. This is how `get_perseus_text` works: (1) the function locates the stylized HTML page
with text ranges (e.g. 1.1-1.9); (2) scrapes the first and last indices; and (3) appends the range to an API call. If, however,
you try ("A.abaeus_1-Z.zygia_1") only the 'A' entries are returned. So we will need a separate call for all the As, Bs, Cs, etc. Here's
the code from start to finish:

{% highlight r %}

library(rvest)
library(tidyverse)

entry_names <- read_html("http://cts.perseids.org/read/pdlrefwk/viaf88890045/003/perseus-eng1") %>%
  html_nodes(".col-md-1") %>%
  html_text() %>%
  as.character() %>%
  stringr::str_trim()

indices_list <- list()
for (L in LETTERS) { 
  l <- keep(entry_names, substr(., 1, 1) == L)
  l_index <- paste(l[1], l[length(l)], sep = "-")
  indices_list <- append(indices_list, l_index)
}

indices_list <- discard(indices_list, ~stringr::str_detect(., "NA"))

BASE_URL <- "http://cts.perseids.org/api/cts/?request=GetPassage&urn=urn:cts:pdlrefwk:viaf88890045.003.perseus-eng1"

perseus_dictionary <- indices_list %>%
  map( ~ paste(BASE_URL, ., sep = ":")) %>%
  map_df(extract_text) %>% #extract_text is a utility function in rperseus. Cf https://github.com/daranzolin/rperseus/blob/master/R/utils.R
  rename(entry = text)

{% endhighlight %}

Let's sample an entry from the dictionary:

```
> sample(perseus_dictionary$entry, 1)
[1] "Cleinis ( Κλεῖνις ), the husband of Harpe and father of Lycius, Ortygius, Harpasus, and Artemicha. He lived in Mesopotamia, near Babylon, and was beloved by Apollo and Artemis. Having heard that the Hyperboreans sacrificed asses to Apollo, he swished to introduce the same custom at Babylon; but Apollo threatened him, and commanded that only sheep, goats, and heifers should be sacrificed. Lycius and Harpasus, the sons of Cleinis, however, persisted in sacrificing asses, whereupon Apollo infuriated the animals so as to attack the family of Cleinis. Other divinities, however, took pity upon the family, and changed all its members into different birds. (Anton Lib. 20.) [ L.S ]"

```

The lesson, as always, never cross Apollo.

In Part II, I'll jump into some fun ways to peruse the dictionary, but let's first see which Olympian has the most mentions (they are a vain lot):

{% highlight r %}

olympians <- c("Athena", "Zeus", "Hera", "Aphrodite", "Hephaestus", "Ares")
map_df(olympians, function(x) {
  tibble(olympian = x,
         mentions = sum(stringr::str_detect(perseus_dictionary$entry, x))
         )
}) %>% 
  arrange(desc(mentions))

{% endhighlight %}

```
# A tibble: 6 x 2
    olympian mentions
       <chr>    <int>
1       Hera      806
2     Athena      762
3       Zeus      501
4  Aphrodite      159
5       Ares      108
6 Hephaestus       75

```

Hera and Athena!

