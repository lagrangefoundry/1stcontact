---
uid: comment-d23cd37e
id: COMMENT-4639
type: comment
title: Comment on chat CHAT-58
created_by: xgd
created_at: '2026-09-30T22:04:36.498520+00:00'
updated_at: '2026-09-30T22:04:36.498520+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: chat-aa503de9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "19a9cdce-7f91-4ca4-93f7-a9f6e444b276",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="fc912d8a-da2b-4d13-84cc-36141e347ad1-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T22:03:58.770501+00:00" -->
#### You
ok please read the transcript for EPIC-19 and the ticket and familiarize yourself with the group chat idea and Alice (consultant) and Bob (assistant) - actually coordinator would be a better word.

What I want to do int this chat is go back to the discussion I started in EPIC-19 and focus on HOW Bob coordinates. The goals for Bob are to work with a novice user to:
1) Guide the process to completion - ensure that there are no major gaps, all goals are accomplished
2) Ensure that Alice's expertise are fully leveraged
3) Keep the user engaged (although lets worry about intercession and talking while Alice is busy later)

We got to the idea of adding Bob to the conversation because my experience  of working with Alice was that to get the benefit I had to be very proactive and a user will not necessarily be that.

That said a failure case for Bob would be driving things too hard or driving things wrong - if we have a user and she knows shat she wants and in what order Bob should not fight her. His job is to check things off in whatever order and make sure that there are no gaps.

We wrote a doc - I forget the number - to describe a process for website building. It was created in the abstract and it was terrible - our analysis (I think this is in the EPIC-19 transcript) is that it bore almost no relation to how I ended up building a site. I think the principles are (1) the user won't know if they like something until they see it (the my know what the don't like but knowing what they do like is harder) (2) refactoring needs to be cheap. We discovered in our exploration that our ability to add pages allows us to create multiple versions of a homepage so the user can compare and contrast.

There are some principles of ordering that I think are worth trying to hold onto, for example if we are creating a five page site it makes sense to figure out the core elements of style, voice etc. on one page before building out the other five pages. But even though I think is a guideline I don't want Bob to be a project management fascist.

So, let's talk about the kinds of things that need to be decided. Building a webpage, like writing code is just a series of decisions that need to be made.
Messaging – voice, intended audience, story we want the audience to take away, breaking that story into pieces that we can share with them ultimately, messaging decisions get us to the structured text that we want on the site.
Style - Colors, fonts, layouts - this is all pretty abstract to a novice user these are things that really need to be shown. To a certain extent that is true of messaging as well but it is easier I think to have the meta conversation about messaging than it is to have the Meta conversation about style.
Images - I don't know if images is a separate conversation or part of the style conversation I broke it out because it seems big enough to be worth doing so but it's probably a facet of style
Functionality this one is actually pretty easy and should be established upfront does the site need a contact form, a blog, subscription payments etc. We will have a fixed list of available features for the user to choose from. These should be decided at the start although of course they can be revisited at any point.

So I think Bob's conversation starts with some basic ingestion of information, possibly using surveys on chat cards. If this got complicated I could imagine a decision diagram of chat cards that might be presented to the user with different cards being presented conditionally based on previous responses. We need to know if the user already has a site if they do we need to know what the site is and we need to know how they feel about it. We need to know what the user is trying to achieve typically this will be more converted customers but it might be more traffic it might be awareness generation it might be warm leads. We need to understand what the customer is trying to get out of the experience and whether that is something that we can measure or find a proxy for. My experience of talking to small business people is that they often can conflate website with what might be called "online marketing" or indeed just marketing. A small business person looking for a better website may really be looking for more leads. And the truth is that that often is not achieved by just changing the website. And anyways that is the whole concept behind first contact we want to be able to control all the necessary levers of the small business so that we can actually meet the customers need.

OK so Bob knows what the customer wants I think typically he would then ask Alice to make a plan. Alice is the brains of the operation she would make a plan. I think we need a plan ticket if we do not have one already which would be an object that where we can store the plan. The key to the plan would be a list of things that need to be done with rough dependencies between them. In practice I think the best approach to website construction is probably to do a very rough and rapid first pass and then multiple rounds of revision until we are satisfied. What is Bob's job here? I think it is to track progress against the plan and make sure all the pieces have been done. It may also be to have a sort of a generic these are all the things that need to be decided for a website concept and to make sure that all those decisions have been made. That will be some judgment here but it's mostly processed judgment.

Part of Bob's role is to explicitly get Alice to check in with what she has built. Does it look like a premium website? Are you sure you're happy with what we have built? I think this needs to be done in a way that isn't too challenging bob should not make Alice look incompetent but nevertheless that was where I got most value out of the expensive model that was Alice in building my websites.

I think I'm starting to circle here I hope you understand the problem that we're trying to solve please don't try to jump to a solution too quickly I think there is some real discussion required to understand this problem. And some of it may have to happen in a real situation. I am going to have to build some websites no doubt with Bob and Alice helping me. However, if we don't think things through before we start if that could be a large space to cover before we get to something effective

<!-- xgd-chat-end -->