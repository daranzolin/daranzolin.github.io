---
layout: post
title:  "The Perseus Dictionary, Part II"
date:   2017-08-27 21:27:02 -0700
categories: Post
tags: R 
---

[In Part I of this series,](https://daranzolin.github.io/articles/2017-08/perseus-dictionary-pi) I showed how to get the Victorian masterpiece, *A Dictionary of Greek and Roman Biography and Mythology* by William Smith, LLD, ed.
In Part II I'm going to explore it, but not in an archaic, linear fashion. It's 2017--we can do better.

I wanted to move beyond mere word counts, and a sentiment analysis makes little sense in this context. And so after perusing several entries,
I was struck by the image of the *network*. A network is an abstraction, a visual representation of connections both explicit and
implicit. Networks are interesting (and very, very slippery) because their cumulative effect is impossible to pin down; if I see
a basketball, a volleyball, a baseball, and a volleyball together, I might think "talent", "hard work", "achievement". But someone else could view the same
cluster of objects and think "absurdity", "waste of time", and "barbarism". Our experience shapes our perception of networks.

<!--more-->

Which brings us to our dictionary--I want to depict networks of entries around certain subjects like "the Peloponnesian War", "Heresy", 
or even individuals like "Achilles". Then I want to see and feel now the cumulative effect of these networks complements or clashes with any preconceived notions. The code below gets us there.

{% highlight r %}

library(tidytext)
library(widyr)
library(ggraph)
library(igraph)
library(stringr)
library(tidyverse)

perseus_dictionary <- readRDS("perseus_dictionary.rds")
perseus_dictionary <- perseus_dictionary %>% 
  dplyr::rowwise() %>% 
  dplyr::mutate(entry_name = stringr::str_replace(stringr::str_split(entry, " ")[[1]][1], "'", ""))

subject_network <- function(subject, center_subject = FALSE) {
  
  subject_words <- perseus_dictionary %>%
    dplyr::filter(str_detect(entry, regex(subject, ignore_case = TRUE))) %>% 
    unnest_tokens(word, entry) %>% 
    dplyr::filter(!word %in% stop_words$word) %>% 
    mutate(word = str_to_title(word))
  
  top_entries <- subject_words %>% 
    filter(word %in% entry_name) %>% 
    count(word) %>% 
    top_n(25, n) %>% 
    pull(word)
  
  subject_words <- subject_words %>% 
    filter(entry_name %in% top_entries,
           word %in% top_entries)
  
  subject_words_cor <- subject_words %>%
    pairwise_cor(entry_name, word)
  
  if (center_subject) {
    subject_words_cor <- subject_words_cor %>% 
      dplyr::filter(item2 == subject)
  }
  
  g <- subject_words_cor %>%
    top_n(100, correlation) %>% 
    filter(correlation > 0) %>% 
    graph_from_data_frame() %>%
    ggraph(layout = "fr") +
    geom_edge_link(aes(edge_colour = correlation)) +
    geom_node_point(color = "pink", size = 7) +
    geom_node_text(aes(label = name), repel = TRUE) +
    theme_void()
  print(g)
}

{% endhighlight %}

A brief explanation: the function `subject_network` first filters all entries containing a regex of the subject input. Stop words are removed, and the 25 top occurring entries. A binary correlation is then calculated between the words, with the option of isolating correlations to subject. Then the correlation is plotted as a network.

Some examples:

{% highlight r %}

subject_network(subject = "Punic War")

{% endhighlight %}

![useful image]({{ site.url }}/assets/Punic_war.png)

Hannibal and Scipio, the two great generals of the Punic Wars, are in the center of the action. The network is built out
by other important generals, consuls, and statesmen. **Cumulative Effect:** Hmmm, generals and senators...but what is the connection to Plautus the comedian and Romulus? As I've since learned, Plautus' plays can be read as commentary on the Second Punic War. And Romulus is connected to the historian Dionysius, whose major work attempts *to justify* Roman dominance up to the First Punic War. He popularized the myth of Romulus for the people.

{% highlight r %}

subject_network(subject = "Athens")

{% endhighlight %}

![useful image]({{ site.url }}/assets/Athens.png)

The Athens network is a role call of the great philosophers, heroes, lawmakers, generals, historians, and playwrights of the Classical Period. **Cumulative Effect:** None. 

{% highlight r %}

subject_network(subject = "Achilles", center_subject = TRUE)

{% endhighlight %}

![useful image]({{ site.url }}/assets/Achiles.png)

By setting `center_subject = TRUE`, you can center the network on the given subject. Here Achilles is enmeshed with the gods and heroes from the Trojan War. **Cumulative Effect:** None. Achilles was an A-list celeb among gods and humans.

The code in this post owes much to [David Robinson's fascinating work on the Stack Overflow surveys.](http://varianceexplained.org/r/stacksurveyr/)





