# intTest#64 英文會話文本語感品質 QA — 逐題查核紀錄（issue #295）

- 查核基準：[etyCfg自訂modScene組態] paramDialogueQualityBar（docs/design.md ＜II.B.(D)＞）
- 查核項目：(a) 自然口語貼齡 (b) 情境貼合場景與角色 (c) 選項同語域有語意辨析價值 (d) 打工正解應允語開頭且體現決策 (e) 無 meta 敘述與考試式 prompt
- 查核方式：issue #295 全量重寫時逐題人工審查（全題非抽樣）；機械面由 `?selftest=data-audit` 守門（應允開頭、非複述、聊天語域共詞、中文對齊）同步驗證
- 查核日期：2026-07-03；查核者：AGT（Claude Code，issue #295 重寫作者複核）
- 結果：**151/151 題全項通過**；重寫清單已清空

| # | 題目 | 題幹（角色台詞） | 正解（公主回應） | 選項數 | a | b | c | d | e |
|---|---|---|---|---|---|---|---|---|---|
| 1 | castle/kingHall/job#1 | Today is the big ceremony, and I want my finest crown. Which one should I bring? | Sure — the gold crown shines the most. Take that one! | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | castle/kingHall/job#2 | The long table needs cups for the feast tonight. Where should they go? | OK — one cup at each seat, so every guest gets one. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | castle/kingHall/job#3 | Guests will arrive soon, and the hall is dusty. What should we do first? | Right away — I'll sweep the floor before they come in. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | castle/kingHall/chat#1 | Good morning, my dear. Did you sleep well? | Good morning, Father! I slept really well. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 5 | castle/kingHall/chat#2 | I have a whole day of royal work ahead of me. | You can do it, Father! I will cheer for you. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 6 | castle/queenStudy/job#1 | I want to read by the window tonight. Where should my book wait for me? | Sure — I'll set it on the little table by the window. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | castle/queenStudy/job#2 | This note is a royal secret. What will you do if someone asks about it? | Of course — I'll keep it safe and give it only to you. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | castle/queenStudy/job#3 | I found a word in this book that I do not know. Can you help me? | Sure — let's open the big dictionary and find it together. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | castle/queenStudy/chat#1 | Reading by the window is my favourite time of day. | I love reading here with you, Mother! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 10 | castle/queenStudy/chat#2 | Thank you for keeping me company today. | I always love our time together, Mother! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 11 | castle/castleKitchen/job#1 | The bread is hot, fresh from the oven. Where should it go to cool? | OK — set it on the rack by the window to cool. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 | castle/castleKitchen/job#2 | The soup pot needs more water. Which water should we use? | Sure — the clean water from the well is best for soup. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 13 | castle/castleKitchen/job#3 | These plates are greasy from lunch. How should we wash them? | No problem — warm water and soap will get them clean. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 14 | castle/castleKitchen/chat#1 | Something smells good in my kitchen, right? | Yes! The warm bread smells so good. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 15 | castle/castleKitchen/chat#2 | Are you hungry after all that running around? | So hungry! May I have a little taste? | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 16 | castle/knightsRoom/job#1 | The parade is today, and my shield is muddy. How can I make it shine? | Sure — rub it with a soft cloth until it shines. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 17 | castle/knightsRoom/job#2 | This sword is very sharp. Where is the safest place to keep it? | Of course — hang it high on the rack, away from little hands. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 18 | castle/knightsRoom/job#3 | This armour is too heavy for one person. How should we move it? | Sure — we can carry it together, one piece at a time. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 19 | castle/knightsRoom/chat#1 | I polished my shield all morning. How does it look? | Wow, your shield shines like a mirror! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 20 | castle/knightsRoom/chat#2 | Would you like to hear about my bravest day? | Yes! I love your brave stories, Theo. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 21 | castle/maidsRoom/job#1 | This sheet is still wet. Should I fold it now or dry it first? | Well, dry it first — then it will fold nice and neat. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 22 | castle/maidsRoom/job#2 | Clean cloths and dirty cloths got all mixed up. Which ones go in the wash basket? | OK — only the dirty ones go in the basket. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 23 | castle/maidsRoom/job#3 | Guests will need towels tonight. Where should the clean towels go? | Sure — stack them on the open shelf where guests can reach. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 24 | castle/maidsRoom/chat#1 | I folded every sheet in the castle today. | Wow, Lala! The sheets look so neat. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 25 | castle/maidsRoom/chat#2 | How are you today, little Princess? | I am great! The castle feels so cosy today. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 26 | castle/castleSeamstress/chat#1 | I sewed this ribbon dress just this morning. Do you like it? | I love it! The ribbon is so pretty. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 27 | castle/castleSeamstress/chat#2 | Every princess needs one dress that twirls. True? | So true! A dress that twirls is the best. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 28 | urban/garden/job#1 | My cat is hiding, and she loves warm, soft places. Where should we look first? | Sure — cats love warm spots. Let's check under the rose bush. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 29 | urban/garden/job#2 | I need three red roses and five pink roses for a bouquet. How many roses is that? | OK — three and five make eight roses. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 30 | urban/garden/job#3 | My white flowers did not sell well yesterday. Can you give me some advice? | Well, you could add some pink roses — people love them. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 31 | urban/garden/chat#1 | Do you like the pink roses in my garden? | Yes, I really love these pink roses! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 32 | urban/garden/chat#2 | Look how the little cat sleeps by the flowers. | Aww, she looks so cosy by the flowers! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 33 | urban/schoolClassroom/job#1 | We have only ten books but twelve children today. What should we do? | OK — two children can share one book for today. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 34 | urban/schoolClassroom/job#2 | There are six children here and four children there. How many children are in class? | Sure — six and four make ten children. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 35 | urban/schoolClassroom/job#3 | The class is reading. Please remind everyone softly. | Sure — I'll say softly, 'Please read quietly, everyone.' | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 36 | urban/schoolClassroom/chat#1 | Good morning, Princess. Ready for class? | Good morning, Teacher! I am all ready. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 37 | urban/schoolClassroom/chat#2 | How do you feel about school today? | I feel great — school is fun today! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 38 | urban/library/job#1 | Should this story book go on the high shelf or the low shelf for small children? | OK — the low shelf, so small children can reach it. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 39 | urban/library/job#2 | I see two blue books and four green books. How many books is that? | Sure — two and four make six books. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 40 | urban/library/job#3 | A child is being loud. Please help me remind him. | Of course — I'll ask him gently to use his quiet voice. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 41 | urban/library/chat#1 | What books do you like, Princess? | Oh, I love story books best! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 42 | urban/library/chat#2 | We always speak softly in the library. | OK, I will speak softly too. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 43 | urban/temple/job#1 | These white flowers look dry. How much water should I give them? | Well — just a little each day keeps them happy. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 44 | urban/temple/job#2 | There are two candles here and two candles there. How many candles is that? | OK — two and two make four candles. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 45 | urban/temple/job#3 | Some visitors are getting noisy in the quiet temple. What should I ask them to do? | Sure — I'll kindly ask them to use soft voices inside. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 46 | urban/temple/chat#1 | How do you feel here, Princess? | I feel calm and quiet here. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 47 | urban/temple/chat#2 | These lilies smell sweet, don't they? | Yes, the lilies smell lovely! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 48 | urban/administration/job#1 | These notes are important. Where should I keep them safe? | OK — lock them in the drawer, and keep the key with you. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 49 | urban/administration/job#2 | I have three stamps here and four stamps there. How many stamps is that? | Sure — three and four make seven stamps. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 50 | urban/administration/job#3 | I lost the town map. Where should we search first? | OK — let's check your busy desk first. It is probably there. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 51 | urban/administration/chat#1 | Nice to meet you, Princess. I am Otto. | Nice to meet you too, Otto! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 52 | urban/administration/chat#2 | Are you busy today, or do you have time to chat? | I have time — let's chat a little! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 53 | urban/market/job#1 | A girl wants some bread. Please ask her kindly what she needs. | Sure! Hello — how many would you like today? | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 54 | urban/market/job#2 | There are three apples and two pears. How many fruits is that? | OK — three and two make five fruits. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 55 | urban/market/job#3 | A customer is leaving. Please say goodbye kindly. | Thank you for coming! See you again soon! | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 56 | urban/market/chat#1 | Are you hungry, Princess? The bread is still warm. | Yes! Warm bread sounds perfect right now. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 57 | urban/market/chat#2 | I baked this bread fresh this morning. | Mmm — fresh bread! It smells wonderful. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 58 | urban/harbor/job#1 | This box has four fish, and that box has two fish. How many fish do I have? | Sure thing — four and two make six fish. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 59 | urban/harbor/job#2 | This big fish must stay fresh until lunch. Where should I put it? | OK — set it on the cold ice right away. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 60 | urban/harbor/job#3 | A cook wants the freshest fish. Which one should I show her? | Of course — show her today's catch. It is the freshest. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 61 | urban/harbor/chat#1 | Do you like the sea, Princess? | Yes, I love the sea and the salty air! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 62 | urban/harbor/chat#2 | My fish came straight off the boat today. | Wow, your fish look so fresh! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 63 | urban/port/job#1 | There are two boats at the left dock and two at the right dock. How many boats is that? | OK — two and two make four boats. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 64 | urban/port/job#2 | The captain's big ship is coming in. Which dock should I send him to? | Sure — send him to the big empty dock. His ship needs room. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 65 | urban/port/job#3 | The dock is busy today. Please help me remind the children to be careful. | Sure — I'll tell them, 'Please walk, do not run here.' | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 66 | urban/port/chat#1 | Have you ever sailed on a big ship, Princess? | Not yet, but I would love to sail one day! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 67 | urban/port/chat#2 | The harbor is busy but happy today. | Yes, the harbor feels so lively today! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 68 | urban/boutique/job#1 | Where should I hang this pretty pink dress so customers can see it? | OK — hang it on the front rail, where everyone walks past. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 69 | urban/boutique/job#2 | There are four dresses here and three dresses there. How many dresses is that? | Sure — four and three make seven dresses. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 70 | urban/boutique/job#3 | A girl likes the blue dress. Please help her kindly. | Of course! Would you like to try it on? | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 71 | urban/boutique/chat#1 | This pink dress just came in. What do you think? | It is so pretty! I love the pink. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 72 | urban/boutique/chat#2 | Thank you for visiting my little shop. | I love your shop — it is so pretty! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 73 | urban/lighthouse/job#1 | It is getting dark, and ships are still out there. Please help me with the lamp. | Right away — I'll light the lamp before the ships come near. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 74 | urban/lighthouse/job#2 | There is one ship near the rocks and one near the dock. How many ships is that? | OK — one and one make two ships. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 75 | urban/lighthouse/job#3 | The sea is calm now. Please tell the sailors down at the dock. | Sure — I'll tell them the sea is calm and safe to sail. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 76 | urban/lighthouse/chat#1 | You can see the whole sea from up here, Princess. | Wow, the sea looks amazing from here! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 77 | urban/lighthouse/chat#2 | The sea wind is strong tonight, Princess. | I love the sea wind on my face! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 78 | rural/mine/job#1 | I found ten stones this morning and sold four. How many stones are left? | Sure — you sold four, so six stones are left. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 79 | rural/mine/job#2 | This stone is heavy, and that one is smaller. Which should we carry first? | Well, start with the smaller one — it is safer to lift. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 80 | rural/mine/job#3 | Stones can fall here. Please tell me what we must wear to stay safe. | Of course — hard hats, so falling stones cannot hurt our heads. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 81 | rural/mine/chat#1 | My morning was busy but good. How was yours? | Mine was busy too, but really fun! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 82 | rural/mine/chat#2 | I am a little tired after carrying stones all day. | You worked so hard! You should rest a little. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 83 | rural/loggingCamp/job#1 | I cut three logs, then four more. How many logs did I cut in all? | OK — three and then four more makes seven logs. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 84 | rural/loggingCamp/job#2 | This log is long, and that log is short. Please help me pick the longer one. | Sure — this one here. It is longer than that short one. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 85 | rural/loggingCamp/job#3 | These logs are heavy. Why should we lift them carefully? | Well, because a dropped log could hurt someone's feet. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 86 | rural/loggingCamp/chat#1 | Why did you come to the logging camp, Princess? | Well, because I wanted to see how you work! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 87 | rural/loggingCamp/chat#2 | I will stack all these logs before lunch. | Sure, I can help you stack them! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 88 | rural/fishingShore/job#1 | One net had five fish, and the other net had five more. How big is the catch? | OK — five and five make ten fish. What a catch! | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 89 | rural/fishingShore/job#2 | The dock is wet and slippery. Please help me remind everyone. | Sure — I'll tell everyone to walk slowly on the wet boards. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 90 | rural/fishingShore/job#3 | The weather looks good for tomorrow. What is our fishing plan? | Of course — we will sail out early and fish again tomorrow. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 91 | rural/fishingShore/chat#1 | I walked along the shore this morning. What did you do? | I explored the village all morning! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 92 | rural/fishingShore/chat#2 | The sea was calm and pretty today. | Yes, the sea was so calm and pretty! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 93 | rural/pasture/job#1 | I saw six sheep, and four more came to the fence. How many sheep are there now? | OK — six and four more make ten sheep. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 94 | rural/pasture/job#2 | A cow is big, and a sheep is small. Please help me compare them. | Sure — the cow is bigger than the sheep. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 95 | rural/pasture/job#3 | The animals are hungry. Why should the hay come first, before other jobs? | Sure — hungry animals cannot wait. Feed them first. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 96 | rural/pasture/chat#1 | Why do you like the pasture, Princess? | Well, because the animals are so sweet! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 97 | rural/pasture/chat#2 | The grass is so green after the rain. | Wow, your pasture looks so green today! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 98 | rural/farm/job#1 | I picked twelve carrots and gave five away. How many carrots are left? | Sure — twelve take away five leaves seven carrots. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 99 | rural/farm/job#2 | The rows are dry. What are we going to do about it? | Sure — we are going to water the rows right away. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 100 | rural/farm/job#3 | The plants are thirsty. Why do we water them? | Well, because water helps them grow big and healthy. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 101 | rural/farm/chat#1 | How do you feel on the farm today? | I feel happy — the farm is lovely today! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 102 | rural/farm/chat#2 | These vegetables look fresh, right? | Wow, your vegetables look so fresh! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 103 | rural/mill/job#1 | I had eight sacks, and the cart took three away. How many sacks are left? | OK — eight take away three leaves five sacks. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 104 | rural/mill/job#2 | This sack is heavy, and that sack is light. Please help me compare them. | Sure — this sack is heavier than that one. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 105 | rural/mill/job#3 | There is flour on the floor. Why should we sweep it up? | Well, because someone could slip on it and fall. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 106 | rural/mill/chat#1 | Why is the mill one of your favourite places? | Well, because the fresh flour smells so warm and sweet! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 107 | rural/mill/chat#2 | Thank you for helping me near the mill today. | Any time! Helping at the mill was fun. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 108 | rural/workwearStall/chat#1 | Why are these clothes good for country work? | Well, because they are strong and easy to move in! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 109 | rural/workwearStall/chat#2 | These clothes look ready for the fields. | Wow, they look strong and ready for anything! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 110 | rural/villageHome/job#1 | I had seven apples, and you brought two more. How many apples do we have? | OK — seven and two more make nine apples. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 111 | rural/villageHome/job#2 | The porch is dusty. Why should we sweep it today? | Well, because a clean porch is nicer and safer for your visitors. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 112 | rural/villageHome/job#3 | You helped me so much today. I have even more work tomorrow — can you come back? | Of course — I'd be glad to come back and help again tomorrow. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 113 | rural/villageHome/chat#1 | Why did you come to visit me, Princess? | I just came to see you, Grandma! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 114 | rural/villageHome/chat#2 | My little home is nice and warm today, right? | Your home is so warm and cosy! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 115 | wild/elfGlade/job#1 | I have watered all the flowers, but I still cannot see the bell. Where should we look next? | Of course! Since the flowers are done, let's search under the leaves next. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 116 | wild/elfGlade/job#2 | The bell might be hiding near the flower that glows the brightest. Which one should we check? | Sure — that tall silver flower glows the brightest. Let's check it. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 117 | wild/elfGlade/job#3 | The elves are far away in the deep woods. How can we call them quickly? | Certainly — if we ring the bell, they will hear us and come. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 118 | wild/elfGlade/chat#1 | How have you been, Princess? | Oh, I have been really well, Elia! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 119 | wild/elfGlade/chat#2 | The flowers that glow are beautiful tonight. | Yes, the flowers that glow are so beautiful! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 120 | wild/fairyAtelier/chat#1 | Have you been well, Princess? | I have been really well, Faye! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 121 | wild/fairyAtelier/chat#2 | The dress that sparkles is my favourite today. | Wow, the dress that sparkles is so lovely! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 122 | wild/stoneGolemPass/job#1 | I have cleaned half of the old road sign. Can you finish the other half while I rest? | Of course — take a break. I'll scrub the rest of the sign now. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 123 | wild/stoneGolemPass/job#2 | A big rock fell from the hill onto the road. Which problem should we fix first? | Sure — the rock that fell is blocking the road, so let's clear it first. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 124 | wild/stoneGolemPass/job#3 | Travellers are waiting behind the rock. What should we do to help them? | Certainly — if we move the rock aside, they will pass safely. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 125 | wild/stoneGolemPass/chat#1 | I have felt a little lonely at the pass today. | Oh, do not worry! I will visit you again soon. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 126 | wild/stoneGolemPass/chat#2 | The travellers who pass here need a clear road. | Yes — and you keep the road clear so well! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 127 | wild/halflingVillage/job#1 | I have checked four doors, and you have checked two more. How many doors have we checked? | Of course — we have checked six doors already. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 128 | wild/halflingVillage/job#2 | The basket might be behind the door that is green. Which door should we try? | Sure — the round green door. Let's try that one first. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 129 | wild/halflingVillage/job#3 | I am not sure which door is mine any more! Please ask me politely for a hint. | Sure — could you tell me which door is yours, please? | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 130 | wild/halflingVillage/chat#1 | Have you had a good day, Princess? | Yes, I have had a really good day! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 131 | wild/halflingVillage/chat#2 | The door that is round is my favourite door. | Wow, the round door is so pretty! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 132 | wild/wizardHut/job#1 | I have labelled two jars, and you have labelled one more. How many jars have we labelled? | Of course — we have labelled three jars so far. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 133 | wild/wizardHut/job#2 | I need the glowing herb jar for tonight's potion. Which jar should I take? | Sure — take the jar that glows blue, on the middle shelf. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 134 | wild/wizardHut/job#3 | The shelf is very high, and I need the top jar. What is the safe plan? | Certainly — if we use the ladder, we will reach it safely. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 135 | wild/wizardHut/chat#1 | Guess what this little herb can do, Princess. | Hmm — does it help sleepy flowers wake up? | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 136 | wild/wizardHut/chat#2 | I have been mixing herbs since sunset. | Wow, you have been mixing herbs since sunset! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 137 | wild/redHoodPath/job#1 | I have cleared the leaves near the first tree. What should we do next? | Of course — since the first tree is done, let's move on to the next one. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 138 | wild/redHoodPath/job#2 | Grandma, who is ill, is waiting for food. What should we pack in her basket? | Sure — warm soup and soft bread would be perfect for her. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 139 | wild/redHoodPath/job#3 | The forest path can be tricky. What safety advice should we remember? | Certainly — stay on the path, and do not talk to strangers. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 140 | wild/redHoodPath/chat#1 | Where are you going today, Princess? | I am going to Grandma's house with you! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 141 | wild/redHoodPath/chat#2 | The path is long, and I feel safer with a friend. | Of course — I will walk the long path with you. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 142 | wild/threePigsCottage/job#1 | I have tied one side of the straw roof. What should we do with the other side? | Of course — since one side is tied, let's tie the other side too. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 143 | wild/threePigsCottage/job#2 | One cottage is made of brick, and two are made of straw. Please help me describe them. | Sure — two cottages are straw, and the strongest one is brick. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 144 | wild/threePigsCottage/job#3 | If the big wind comes again, we need the safest house. Please say the plan. | Certainly — if the wind blows, we will all meet in the brick house. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 145 | wild/threePigsCottage/chat#1 | Princess, I have just built a brand-new house! | Wow, Pippo! Your new house looks great. | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 146 | wild/threePigsCottage/chat#2 | The house that is built of brick feels safe. | Yes, the brick house is really strong! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 147 | wild/treeSpiritGrove/job#1 | I have prepared the soil for the glowing seed. What have you done with the seed? | Of course — I have planted it right in the middle of the soil. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 148 | wild/treeSpiritGrove/job#2 | The oldest tree holds the grove's magic. Which tree should we ask for help? | Sure — the old tree that whispers. Let's ask it politely. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 149 | wild/treeSpiritGrove/job#3 | The glowing seed is planted. How can we help it grow tall and strong? | Certainly — if it gets moonlight and water, it will grow tall. | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 150 | wild/treeSpiritGrove/chat#1 | How have you been, Princess? | I have been helping my friends all day! | 2 | ✅ | ✅ | ✅ | — | ✅ |
| 151 | wild/treeSpiritGrove/chat#2 | Thank you for visiting my peaceful grove. | I love this grove — it is so peaceful! | 2 | ✅ | ✅ | ✅ | — | ✅ |

> (d) 欄僅適用打工任務（生活聊天不受應允開頭與決策性要求，標 —）。
