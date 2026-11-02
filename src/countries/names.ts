/**
 * Name pools for every country. Each pool aims for realistic variety rather than only the
 * top ten: common names across generations, plus names from each country's larger
 * immigrant communities. Lists are comma-separated strings to keep them easy to scan and edit.
 *
 * Rules the generators rely on:
 * - Given names are single words (Mexican CURP and Italian codice fiscale treat compound
 *   names specially, so avoid "María José" style entries).
 * - Surnames carry no gender (no "Kaur", "Begum"). Russian female surnames are derived.
 * - Mexican surnames have no particles ("De la Cruz") because CURP skips them.
 */

const list = (s: string): string[] => s.split(',').map((x) => x.trim()).filter(Boolean);
/** "native latin" pairs, comma-separated. */
const pairs = (s: string): [string, string][] => list(s).map((x) => x.split(/\s+/) as [string, string]);
/** "kanji romaji katakana" triples, comma-separated. */
const triples = (s: string): [string, string, string][] => list(s).map((x) => x.split(/\s+/) as [string, string, string]);

/**
 * Surnames that change with gender are written "male/female", e.g. "Kowalski/Kowalska".
 * Returns the form for the given gender; plain entries are returned unchanged.
 */
export function surnameFor(entry: string, gender: 'male' | 'female'): string {
  const [male, female] = entry.split('/');
  return gender === 'female' && female ? female : male;
}

export interface NamePool {
  male: string[];
  female: string[];
  family: string[];
}

// ---------------------------------------------------------------------------- Latin-script countries

export const NAMES: Record<string, NamePool> = {
  GB: {
    male: list(`Oliver, George, Harry, Jack, Jacob, Noah, Charlie, Thomas, James, William, Daniel, Mohammed, Samuel,
      Joshua, Liam, Ethan, Arjun, Callum, Alfie, Archie, Freddie, Henry, Leo, Oscar, Theo, Arthur, Isaac, Lucas, Max,
      Alexander, Benjamin, Edward, Joseph, Adam, Ryan, Matthew, Luke, Dylan, Kieran, Jamal, Hassan, Rohan, Tomasz,
      Rhys, Owen, Euan, Finlay, Kwame, Ibrahim, Yusuf, Aaron, Nathan, Elliot, Gareth, Stuart, Graham, Neil`),
    female: list(`Olivia, Amelia, Isla, Ava, Emily, Sophie, Grace, Lily, Chloe, Jessica, Charlotte, Ella, Hannah, Priya,
      Freya, Evie, Aisha, Niamh, Mia, Poppy, Ruby, Florence, Rosie, Daisy, Phoebe, Alice, Matilda, Maisie, Sienna,
      Zara, Layla, Fatima, Maryam, Ellie, Holly, Lucy, Rebecca, Katie, Megan, Bethany, Rhiannon, Eilidh, Amara,
      Zainab, Anika, Zofia, Imogen, Harriet, Eleanor, Abigail, Leah, Joanne, Karen, Claire, Gemma`),
    family: list(`Smith, Jones, Taylor, Brown, Williams, Wilson, Johnson, Davies, Patel, Robinson, Wright, Thompson,
      Evans, Walker, White, Roberts, Green, Hall, Khan, Clarke, Lewis, Hughes, Edwards, Wood, Campbell, O'Brien,
      Turner, Hill, Cooper, Ward, Morris, Moore, Clark, Lee, King, Baker, Harrison, Morgan, Allen, James, Scott,
      Phillips, Watson, Parker, Price, Bennett, Young, Griffiths, Mitchell, Kelly, Cook, Carter, Richardson, Bailey,
      Collins, Bell, Shaw, Murphy, Cox, Ali, Hussain, Ahmed, Singh, Nowak, Okafor, Mensah, Chen, Nguyen, MacDonald,
      Stewart, Fraser, Jenkins, Lloyd, Pritchard, Doyle`),
  },
  DE: {
    male: list(`Lukas, Leon, Finn, Jonas, Paul, Felix, Maximilian, Elias, Tim, Jan, Stefan, Thomas, Noah, Ben, Henry,
      Emil, Anton, Theo, Moritz, Niklas, Julian, Philipp, Alexander, David, Simon, Tobias, Fabian, Sebastian, Daniel,
      Michael, Andreas, Markus, Christian, Matthias, Frank, Jürgen, Uwe, Klaus, Wolfgang, Can, Mehmet, Luca, Dominik`),
    female: list(`Anna, Emma, Mia, Hannah, Lena, Sophie, Laura, Lea, Julia, Sarah, Katharina, Sabine, Marie, Lina,
      Clara, Ella, Emilia, Leonie, Johanna, Charlotte, Lara, Paula, Amelie, Nina, Melanie, Nicole, Andrea, Petra,
      Claudia, Susanne, Monika, Birgit, Ursula, Franziska, Jana, Ayşe, Elif, Leyla, Greta, Ida`),
    family: list(`Müller, Schmidt, Schneider, Fischer, Weber, Meyer, Wagner, Becker, Schulz, Hoffmann, Koch, Richter,
      Wolf, Schröder, Schäfer, Klein, Neumann, Schwarz, Zimmermann, Braun, Krüger, Hofmann, Hartmann, Lange, Schmitt,
      Werner, Krause, Meier, Lehmann, Schmid, Schulze, Maier, Köhler, Herrmann, König, Walter, Mayer, Huber, Kaiser,
      Fuchs, Peters, Lang, Scholz, Möller, Weiß, Jung, Hahn, Vogel, Friedrich, Keller, Günther, Berger, Winkler, Roth,
      Beck, Lorenz, Baumann, Albrecht, Kaya, Nowak, Öztürk`),
  },
  FR: {
    male: list(`Lucas, Hugo, Louis, Gabriel, Arthur, Jules, Thomas, Nicolas, Julien, Antoine, Léo, Raphaël, Adam, Paul,
      Maël, Noah, Ethan, Nathan, Théo, Tom, Maxime, Alexandre, Pierre, Mathieu, François, Philippe, Olivier,
      Sébastien, Guillaume, Romain, Karim, Mehdi, Yanis, Benoît, Christophe, Laurent, Jérôme`),
    female: list(`Emma, Louise, Jade, Alice, Chloé, Léa, Manon, Camille, Sarah, Juliette, Rose, Anna, Lina, Mia, Inès,
      Zoé, Léna, Ambre, Marie, Sophie, Isabelle, Nathalie, Céline, Aurélie, Émilie, Claire, Mathilde, Pauline,
      Margaux, Sabrina, Amina, Yasmine, Océane, Élodie, Sandrine, Valérie, Brigitte`),
    family: list(`Martin, Bernard, Dubois, Thomas, Robert, Richard, Petit, Durand, Leroy, Moreau, Simon, Laurent,
      Lefèvre, Michel, Garcia, David, Bertrand, Roux, Vincent, Fournier, Morel, Girard, André, Mercier, Dupont,
      Lambert, Bonnet, François, Martinez, Legrand, Garnier, Faure, Rousseau, Blanc, Guérin, Muller, Henry, Roussel,
      Nicolas, Perrin, Morin, Mathieu, Clément, Gauthier, Dumont, Lopez, Fontaine, Chevalier, Robin, Masson, Benali,
      Haddad, Nguyen`),
  },
  ES: {
    male: list(`Hugo, Martín, Lucas, Mateo, Daniel, Alejandro, Pablo, Javier, David, Carlos, Manuel, Álvaro, Diego,
      Adrián, Sergio, Jorge, Antonio, José, Francisco, Juan, Miguel, Rafael, Fernando, Iker, Marc, Pol, Gonzalo,
      Raúl, Rubén, Íñigo, Óscar, Andrés, Jaime, Víctor, Enrique, Ignacio`),
    female: list(`Lucía, Sofía, Martina, María, Paula, Julia, Valeria, Carmen, Laura, Elena, Daniela, Alba, Noa, Emma,
      Ana, Isabel, Marta, Cristina, Pilar, Rosa, Teresa, Nerea, Ainhoa, Irene, Andrea, Sara, Claudia, Natalia,
      Beatriz, Raquel, Silvia, Rocío, Montserrat, Leire, Inmaculada, Lorena`),
    family: list(`García, Rodríguez, González, Fernández, López, Martínez, Sánchez, Pérez, Gómez, Martín, Jiménez,
      Ruiz, Hernández, Díaz, Moreno, Muñoz, Álvarez, Romero, Alonso, Gutiérrez, Navarro, Torres, Domínguez, Vázquez,
      Ramos, Gil, Ramírez, Serrano, Blanco, Molina, Morales, Suárez, Ortega, Delgado, Castro, Ortiz, Rubio, Marín,
      Sanz, Iglesias, Núñez, Medina, Garrido, Cortés, Castillo, Santos, Lozano, Guerrero, Cano, Prieto, Méndez,
      Cruz, Calvo, Gallego, Vidal, León, Herrera, Peña`),
  },
  IT: {
    male: list(`Leonardo, Francesco, Alessandro, Lorenzo, Mattia, Andrea, Gabriele, Marco, Luca, Giuseppe, Tommaso,
      Riccardo, Edoardo, Giovanni, Pietro, Diego, Davide, Filippo, Antonio, Federico, Nicolò, Samuele, Emanuele,
      Simone, Matteo, Stefano, Paolo, Roberto, Salvatore, Vincenzo, Alberto, Fabio, Claudio, Massimo, Enzo`),
    female: list(`Sofia, Giulia, Aurora, Alice, Ginevra, Emma, Giorgia, Francesca, Chiara, Martina, Beatrice, Anna,
      Vittoria, Ludovica, Matilde, Camilla, Gaia, Elena, Sara, Noemi, Valentina, Alessia, Elisa, Federica, Silvia,
      Paola, Laura, Roberta, Simona, Monica, Rosa, Teresa, Antonella, Serena, Ilaria, Lucia`),
    family: list(`Rossi, Russo, Ferrari, Esposito, Bianchi, Romano, Colombo, Ricci, Marino, Greco, Bruno, Gallo,
      Conti, De Luca, Mancini, Costa, Giordano, Rizzo, Lombardi, Moretti, Barbieri, Fontana, Santoro, Mariani,
      Rinaldi, Caruso, Ferrara, Galli, Martini, Leone, Longo, Gentile, Martinelli, Vitale, Lombardo, Serra, Coppola,
      De Santis, D'Angelo, Marchetti, Parisi, Villa, Conte, Ferraro, Ferri, Fabbri, Bianco, Marini, Grasso,
      Valentini, Messina, Sala, De Angelis, Gatti, Pellegrini, Palumbo, Sanna`),
  },
  NL: {
    male: list(`Daan, Sem, Lucas, Levi, Finn, Bram, Thijs, Jesse, Ruben, Lars, Noah, Luuk, Milan, Sven, Gijs, Thomas,
      Max, Jan, Pieter, Kees, Hendrik, Joost, Wouter, Bas, Niels, Stijn, Tim, Mohamed, Yusuf, Mees, Teun, Jeroen`),
    female: list(`Emma, Julia, Mila, Tess, Sophie, Zoë, Sara, Anna, Eva, Lotte, Fenna, Saar, Nora, Liv, Lieke, Fleur,
      Isa, Roos, Femke, Anouk, Sanne, Lisa, Marieke, Ingrid, Annemieke, Esther, Inge, Noor, Yara, Maud, Sterre`),
    family: list(`de Jong, Jansen, de Vries, van den Berg, van Dijk, Bakker, Janssen, Visser, Smit, Meijer, de Boer,
      Mulder, de Groot, Bos, Vos, Peters, Hendriks, van Leeuwen, Dekker, Brouwer, de Wit, Dijkstra, Smits, de Graaf,
      van der Meer, van der Linden, Kok, Jacobs, de Haan, Vermeulen, van den Heuvel, van der Veen, van den Broek,
      de Bruijn, van der Heijden, Schouten, van Beek, Willems, van Vliet, van de Ven, Hoekstra, Maas, Verhoeven,
      Koster, van Dam, Prins, Blom, Huisman, El Amrani, Öztürk`),
  },
  IE: {
    male: list(`Jack, James, Noah, Conor, Daniel, Seán, Cian, Oisín, Patrick, Darragh, Fionn, Tadhg, Rían, Liam,
      Michael, Ryan, Luke, Adam, Charlie, Thomas, Harry, Cillian, Ronan, Eoin, Niall, Shane, Declan, Brian, Kevin,
      Colm, Ruairí, Donal, Paddy, Aidan`),
    female: list(`Emily, Grace, Fiadh, Sophie, Aoife, Saoirse, Ciara, Niamh, Róisín, Siobhán, Ava, Lucy, Ellie,
      Amelia, Mia, Chloe, Sadhbh, Caoimhe, Éabha, Clodagh, Orla, Mary, Áine, Bríd, Sinéad, Gráinne, Nuala, Deirdre,
      Aisling, Méabh, Laura, Sarah, Emer`),
    family: list(`Murphy, Kelly, O'Sullivan, Walsh, Smith, O'Brien, Byrne, Ryan, O'Connor, O'Neill, Doyle, McCarthy,
      Murray, Quinn, Moore, McLaughlin, Carroll, Connolly, Daly, O'Connell, Dunne, Brennan, Burke, Collins,
      Campbell, Clarke, Farrell, Fitzgerald, Maguire, Nolan, Flynn, O'Donnell, Duffy, O'Mahony, Boyle, Healy,
      O'Shea, Sweeney, Hayes, Kavanagh, Power, McGrath, Moran, Brady, Casey, Foley, Fitzpatrick, O'Leary, Donnelly,
      O'Donovan, Whelan, Lynch, Kennedy, O'Keeffe, Gallagher, Kowalski`),
  },
  BE: {
    male: list(`Lucas, Louis, Noah, Arthur, Liam, Adam, Jules, Victor, Thomas, Mathis, Finn, Leon, Gabriel, Mohamed,
      Lars, Wout, Jef, Pieter, Bart, Koen, Dirk, Stijn, Thibault, Maxime, Julien, Nicolas, Mathieu, Olivier, Simon,
      Vincent, Rayan`),
    female: list(`Olivia, Emma, Louise, Mila, Alice, Elena, Juliette, Lina, Marie, Sofia, Nora, Anna, Ella, Fleur,
      Lotte, Lore, Eline, Sofie, An, Els, Ine, Katrien, Hanne, Charlotte, Camille, Manon, Chloé, Aurélie, Pauline,
      Inès, Amira`),
    family: list(`Peeters, Janssens, Maes, Jacobs, Mertens, Willems, Claes, Goossens, Wouters, De Smet, Dubois,
      Lambert, Martin, Dupont, Leroy, Simon, Laurent, Lemaire, Renard, Hermans, Pauwels, Vermeulen, Van den Bossche,
      De Clercq, Michiels, Dumont, Desmet, Van Damme, Smets, Aerts, Dupuis, Lejeune, Hendrickx, De Backer, Claeys,
      Verstraete, Martens, Van de Velde, Lemmens, Cools, Leclercq, Fontaine, Bosmans, De Wilde, Coppens, Segers,
      Moens, Thys, Vandenberghe, El Idrissi`),
  },
  AT: {
    male: list(`Lukas, Tobias, David, Elias, Jakob, Maximilian, Florian, Paul, Simon, Michael, Fabian, Lorenz, Leon,
      Jonas, Felix, Matteo, Moritz, Valentin, Raphael, Alexander, Stefan, Martin, Andreas, Thomas, Christoph,
      Markus, Johannes, Gerhard, Josef, Franz, Wolfgang, Manuel`),
    female: list(`Anna, Hannah, Lena, Sarah, Sophia, Laura, Katharina, Marie, Julia, Valentina, Emma, Lea, Leonie, Mia,
      Magdalena, Elena, Theresa, Johanna, Viktoria, Verena, Christina, Sabine, Andrea, Elisabeth, Barbara, Martina,
      Birgit, Daniela, Petra, Eva`),
    family: list(`Gruber, Huber, Bauer, Wagner, Müller, Pichler, Steiner, Moser, Mayer, Hofer, Leitner, Berger,
      Wimmer, Egger, Lang, Schmid, Weber, Schwarz, Maier, Winkler, Schneider, Fischer, Wolf, Auer, Reiter, Brunner,
      Fuchs, Baumgartner, Eder, Aigner, Lechner, Schober, Holzer, Haas, Wieser, Mair, Koller, Riegler, Lehner,
      Kaiser, Hofmann, Strasser, Binder, Ebner, Novak, Horvath`),
  },
  PT: {
    male: list(`João, Francisco, Afonso, Duarte, Tomás, Rodrigo, Martim, Pedro, Miguel, Tiago, Santiago, Guilherme,
      Gabriel, Lucas, Gonçalo, Diogo, Vicente, Salvador, Lourenço, Gustavo, Henrique, Rafael, Bernardo, Simão,
      Manuel, José, António, Rui, Nuno, Paulo, Ricardo, Carlos, Bruno, Hugo`),
    female: list(`Maria, Leonor, Matilde, Beatriz, Carolina, Ana, Inês, Mariana, Sofia, Francisca, Alice, Benedita,
      Clara, Laura, Lara, Margarida, Constança, Madalena, Íris, Joana, Rita, Catarina, Teresa, Sara, Patrícia,
      Cláudia, Sandra, Isabel, Helena, Filipa, Marta, Raquel`),
    family: list(`Silva, Santos, Ferreira, Pereira, Oliveira, Costa, Rodrigues, Martins, Sousa, Fernandes, Gonçalves,
      Almeida, Ribeiro, Carvalho, Lopes, Marques, Alves, Gomes, Vieira, Monteiro, Cardoso, Rocha, Neves, Coelho, Cruz,
      Cunha, Pires, Ramos, Reis, Simões, Antunes, Mendes, Correia, Fonseca, Mota, Moreira, Nunes, Pinto, Teixeira,
      Barbosa, Tavares, Machado, Araújo, Batista, Henriques, Lourenço, Matos, Miranda, Faria, Castro, Brito, Vaz`),
  },
  FI: {
    male: list(`Leo, Elias, Oliver, Eino, Väinö, Onni, Mikael, Juho, Matti, Antti, Aleksi, Lauri, Ville, Mikko, Jussi,
      Janne, Petri, Tuomas, Eetu, Veeti, Aatu, Niilo, Toivo, Lenni, Otto, Kalle, Pekka, Timo, Jari, Heikki, Ilmari,
      Joonas`),
    female: list(`Aino, Eevi, Olivia, Helmi, Sofia, Aada, Emilia, Ella, Laura, Johanna, Linnea, Pihla, Venla, Kerttu,
      Isla, Lilja, Iida, Siiri, Anni, Emma, Sanna, Anna, Maria, Katja, Tiina, Minna, Riikka, Hanna, Satu, Päivi,
      Leena, Noora`),
    family: list(`Korhonen, Virtanen, Mäkinen, Nieminen, Mäkelä, Hämäläinen, Laine, Heikkinen, Koskinen, Järvinen,
      Lehtonen, Lehtinen, Salminen, Heinonen, Niemi, Heikkilä, Kinnunen, Salonen, Turunen, Salo, Laitinen, Tuominen,
      Rantanen, Karjalainen, Jokinen, Mattila, Savolainen, Lahtinen, Ahonen, Hiltunen, Kallio, Miettinen, Leinonen,
      Pitkänen, Aaltonen, Manninen, Hakala, Lindholm, Nyström, Lindberg`),
  },
  AU: {
    male: list(`Oliver, Jack, William, Noah, Thomas, Lachlan, Cooper, Riley, Liam, Ethan, Hamish, Henry, James, Lucas,
      Leo, Charlie, Harrison, Archie, Mason, Max, Isaac, Hudson, Lincoln, Jayden, Jordan, Matthew, Daniel, Michael,
      Andrew, Ryan, Josh, Luke, Benjamin, Samuel, Kai, Ahmed, Arjun, Minh, Bradley, Darren`),
    female: list(`Charlotte, Olivia, Mia, Ava, Chloe, Isla, Matilda, Ruby, Sophie, Grace, Zoe, Amelia, Willow, Harper,
      Evie, Ella, Sienna, Lily, Isabella, Hazel, Frankie, Georgia, Jessica, Emily, Hannah, Sarah, Emma, Kate,
      Rachel, Jasmine, Mei, Priya, Linh, Aaliyah, Kylie, Tahlia`),
    family: list(`Smith, Jones, Williams, Brown, Wilson, Taylor, Nguyen, Johnson, Martin, White, Anderson, Walker,
      Thompson, Kelly, Lee, Harris, Ryan, King, Robinson, Wright, Clarke, Young, Mitchell, Campbell, Roberts, Green,
      Hall, Wood, Jackson, Hughes, Edwards, Lewis, Murphy, Tran, Le, Pham, Chen, Wang, Singh, Patel, Russo,
      Papadopoulos, Nikolaidis, Ahmed, O'Brien, Kennedy, Stewart, Scott, Baker, Cooper, Turner, Morris, Brennan`),
  },
  NZ: {
    male: list(`Oliver, Jack, Noah, Leo, George, Lucas, Charlie, Mason, Nikau, Tama, Wiremu, Hunter, Arlo, Hudson, Ari,
      Theo, Henry, William, Thomas, James, Liam, Ethan, Samuel, Benjamin, Daniel, Matiu, Rawiri, Hemi, Manaia,
      Ihaia, Tāne, Sione, Viliami, Ravi, Hamish, Angus`),
    female: list(`Isla, Charlotte, Amelia, Olivia, Mia, Harper, Aria, Ruby, Mere, Aroha, Anahera, Ava, Lily, Sophie,
      Grace, Willow, Ella, Emily, Hannah, Kate, Lucy, Ngaio, Kaia, Hine, Moana, Ataahua, Mele, Losana, Priya, Mei,
      Maia`),
    family: list(`Smith, Wilson, Williams, Brown, Taylor, Jones, Singh, Anderson, Thompson, Walker, Ngata, Parata,
      Tipene, Robinson, White, Harris, Martin, Clark, King, Young, Campbell, Stewart, Scott, Kelly, Moore, Wood,
      Green, Hall, Edwards, Hughes, Wihongi, Tamihana, Henare, Rangi, Tuilagi, Fifita, Taufa, Patel, Chen, Li, Kumar,
      Nguyen, Te Kani`),
  },
  IN: {
    male: list(`Aarav, Arjun, Rohan, Vikram, Rahul, Aditya, Karthik, Siddharth, Amit, Vihaan, Ishaan, Reyansh, Ayaan,
      Krishna, Sai, Dhruv, Kabir, Arnav, Ankit, Sanjay, Suresh, Rajesh, Manoj, Prakash, Deepak, Nikhil, Varun,
      Harsh, Kunal, Pranav, Abhishek, Gaurav, Rakesh, Venkatesh, Mohammed, Imran, Farhan`),
    female: list(`Priya, Ananya, Kavya, Neha, Pooja, Divya, Lakshmi, Aditi, Sneha, Ishita, Saanvi, Aadhya, Diya,
      Anika, Myra, Riya, Shreya, Meera, Anjali, Sunita, Kavita, Rekha, Swati, Nandini, Deepika, Pallavi, Shalini,
      Radhika, Madhuri, Fatima, Ayesha, Simran, Tanvi`),
    family: list(`Sharma, Patel, Singh, Kumar, Gupta, Reddy, Iyer, Nair, Das, Mehta, Joshi, Banerjee, Rao, Verma,
      Shah, Desai, Jain, Agarwal, Chopra, Malhotra, Kapoor, Bhatt, Pillai, Menon, Krishnan, Naidu, Chatterjee,
      Mukherjee, Bose, Ghosh, Sen, Mishra, Pandey, Tiwari, Yadav, Chauhan, Thakur, Kulkarni, Deshpande, Patil, Khan,
      Shaikh, Ansari, Fernandes, D'Souza, Gill, Sandhu, Sethi, Saxena, Bhattacharya`),
  },
  US: {
    male: list(`James, Michael, Robert, John, David, William, Christopher, Daniel, Matthew, Anthony, Jose, Tyler,
      Joseph, Charles, Thomas, Joshua, Andrew, Ryan, Brandon, Justin, Kevin, Brian, Jason, Eric, Kyle, Ethan, Noah,
      Liam, Mason, Logan, Jacob, Aiden, Elijah, Caleb, Luis, Carlos, Juan, Diego, DeShawn, Jamal, Marcus, Darnell,
      Wei, Kenji, Raj, Hunter, Cody, Austin`),
    female: list(`Mary, Jennifer, Linda, Elizabeth, Jessica, Sarah, Ashley, Emily, Madison, Olivia, Maria, Taylor,
      Patricia, Barbara, Susan, Karen, Nancy, Lisa, Sandra, Stephanie, Rebecca, Amanda, Samantha, Hannah, Abigail,
      Emma, Ava, Sophia, Isabella, Mia, Chloe, Brianna, Destiny, Aaliyah, Imani, Jasmine, Gabriela, Daniela, Mei,
      Priya, Kayla, Brittany`),
    family: list(`Smith, Johnson, Williams, Brown, Jones, Garcia, Miller, Davis, Rodriguez, Martinez, Hernandez, Lopez,
      Wilson, Anderson, Thomas, Moore, Jackson, Lee, Taylor, White, Harris, Martin, Thompson, Robinson, Clark, Lewis,
      Walker, Hall, Allen, Young, King, Wright, Scott, Torres, Nguyen, Hill, Flores, Green, Adams, Nelson, Baker,
      Rivera, Campbell, Mitchell, Carter, Roberts, Gomez, Phillips, Evans, Turner, Diaz, Parker, Cruz, Edwards,
      Collins, Reyes, Stewart, Morris, Morales, Murphy, Cook, Rogers, Gutierrez, Ortiz, Morgan, Cooper, Peterson,
      Bailey, Reed, Kelly, Howard, Ramos, Kim, Ward, Richardson, Watson, Brooks, Chavez, Wood, Bennett, Gray,
      Mendoza, Hughes, Price, Patel, Myers, Ross, Foster, Washington, O'Connor, Chen, Wong, Kowalski, Schmidt`),
  },
  MX: {
    male: list(`Juan, Luis, Carlos, Miguel, Jorge, Alejandro, Fernando, Ricardo, Diego, Santiago, José, Eduardo,
      Roberto, Javier, Francisco, Antonio, Manuel, Pedro, Raúl, Sergio, Arturo, Héctor, Óscar, Emiliano, Mateo,
      Sebastián, Leonardo, Gael, Iker, Rodrigo, Adrián, Armando, Enrique, Gerardo, Jesús, Ángel, Marco`),
    female: list(`Guadalupe, Ana, Sofía, Fernanda, Daniela, Valeria, Gabriela, Alejandra, Ximena, Regina, María,
      Mariana, Paola, Andrea, Karla, Diana, Laura, Adriana, Verónica, Patricia, Rosa, Claudia, Leticia, Lucía,
      Camila, Victoria, Renata, Natalia, Itzel, Montserrat, Fátima, Brenda, Araceli, Yolanda, Isabel, Teresa`),
    family: list(`Hernández, García, Martínez, López, González, Rodríguez, Pérez, Sánchez, Ramírez, Flores, Torres,
      Morales, Gómez, Díaz, Cruz, Reyes, Gutiérrez, Ruiz, Mendoza, Aguilar, Ortiz, Moreno, Castillo, Romero, Álvarez,
      Méndez, Chávez, Rivera, Juárez, Ramos, Domínguez, Herrera, Medina, Vázquez, Castro, Vargas, Guzmán, Velázquez,
      Salazar, Rojas, Contreras, Luna, Ortega, Estrada, Guerrero, Jiménez, Cortés, Núñez, Delgado, Soto, Ríos,
      Mejía, Navarro, Cervantes, Peña, Ibarra, Sandoval, Campos, Figueroa, Valdez, Muñoz`),
  },
  BR: {
    male: list(`Lucas, Gabriel, Pedro, Rafael, Matheus, João, Gustavo, Felipe, Bruno, Thiago, Enzo, Arthur, Heitor,
      Davi, Bernardo, Samuel, Lorenzo, Théo, Miguel, Guilherme, Gael, Henrique, Rodrigo, Leonardo, Eduardo, Diego,
      Vinícius, André, Marcelo, Carlos, Paulo, Ricardo, Fábio, Leandro, Caio, Igor, Renato`),
    female: list(`Ana, Maria, Juliana, Beatriz, Larissa, Camila, Fernanda, Mariana, Letícia, Isabela, Alice, Helena,
      Laura, Manuela, Valentina, Sophia, Heloísa, Lívia, Lorena, Cecília, Clara, Gabriela, Amanda, Bruna, Natália,
      Vitória, Patrícia, Aline, Vanessa, Tatiana, Daniela, Carolina, Rafaela, Luana, Bianca, Raquel`),
    family: list(`Silva, Santos, Oliveira, Souza, Pereira, Costa, Rodrigues, Almeida, Ferreira, Lima, Carvalho, Gomes,
      Ribeiro, Martins, Rocha, Alves, Araújo, Barbosa, Cardoso, Nascimento, Castro, Moreira, Mendes, Teixeira,
      Correia, Dias, Nunes, Monteiro, Vieira, Freitas, Ramos, Machado, Batista, Campos, Pinto, Moura, Cavalcanti,
      Azevedo, Fernandes, Duarte, Cunha, Lopes, Marques, Rezende, Sampaio, Fonseca, Andrade, Tavares, Siqueira,
      Brito, Peixoto, Sato, Yamamoto, Haddad`),
  },
  CA: {
    male: list(`Liam, Noah, William, Lucas, Benjamin, Jacob, Ethan, Logan, Nathan, Thomas, Samuel, Félix, Olivier,
      Gabriel, Alexandre, Jean, Mathieu, Raphaël, Ryan, Tyler, Connor, Justin, Matthew, Daniel, Michael, Kevin, Arjun,
      Wei, Jun, Amir, Omar, Mohamed, Hunter, Owen, Cole, Marc`),
    female: list(`Olivia, Emma, Charlotte, Amelia, Sophia, Chloé, Léa, Florence, Alice, Emily, Ava, Abigail, Madison,
      Hannah, Sarah, Jessica, Ashley, Stéphanie, Isabelle, Julie, Marie, Catherine, Mélanie, Priya, Mei, Fatima,
      Zara, Maya, Jasmine, Megan, Kayla, Brooke, Geneviève, Nathalie`),
    family: list(`Smith, Brown, Tremblay, Martin, Roy, Wilson, MacDonald, Gagnon, Johnson, Taylor, Côté, Campbell,
      Anderson, Leblanc, Lee, Bouchard, Gauthier, Morin, Lavoie, Fortin, Gagné, Ouellet, Pelletier, Bélanger,
      Lévesque, Bergeron, Leclerc, White, Thompson, Clark, Stewart, Robinson, Scott, Murray, Young, Kelly, Singh,
      Patel, Wong, Chan, Li, Nguyen, Khan, Sandhu, Gill, Mohamed, Fraser, Cameron, Ross, Miller, Walker, Reid`),
  },
  CH: {
    male: list(`Luca, Noah, Leon, Liam, Elias, Gabriel, Matteo, Samuel, David, Louis, Nico, Jonas, Lukas, Daniel, Thomas,
      Martin, Peter, Marco, Andreas, Christian, Reto, Urs, Beat, Stefan, Patrick, Pascal, Julien, Nicolas, Alessandro,
      Lorenzo, Adrian, Fabian, Simon, Raphael, Yannick, Jürg`),
    female: list(`Mia, Emma, Lina, Sofia, Lea, Elena, Mila, Lara, Laura, Anna, Sarah, Nina, Julia, Sandra, Nicole,
      Andrea, Monika, Daniela, Barbara, Claudia, Chloé, Camille, Léa, Manon, Giulia, Chiara, Martina, Alessia, Céline,
      Jasmin, Seraina, Ursula, Ruth, Corinne, Valérie`),
    family: list(`Müller, Meier, Schmid, Keller, Weber, Huber, Schneider, Meyer, Steiner, Fischer, Gerber, Brunner,
      Baumann, Frei, Zimmermann, Moser, Widmer, Wyss, Graf, Roth, Favre, Rochat, Bonvin, Martin, Rossi, Bernasconi,
      Ferrari, Bianchi, Lombardi, Fontana, Pittet, Morel, Perret, Jaquet, Gasser, Kunz, Lüthi, Bachmann, Suter, Hofer,
      Ammann, Marti, Gfeller, Zürcher, Bühler, Sutter, Vogel, Hug, Berger, Kaufmann, Kälin, Arnold`),
  },
  PL: {
    male: list(`Jan, Antoni, Aleksander, Franciszek, Jakub, Szymon, Filip, Mikołaj, Wojciech, Kacper, Piotr, Krzysztof,
      Andrzej, Tomasz, Paweł, Michał, Marcin, Grzegorz, Łukasz, Adam, Marek, Mateusz, Dawid, Bartosz, Kamil, Rafał,
      Stanisław, Józef, Zbigniew, Ryszard, Damian, Sebastian`),
    female: list(`Zuzanna, Julia, Zofia, Hanna, Maja, Lena, Alicja, Oliwia, Laura, Anna, Maria, Katarzyna, Małgorzata,
      Agnieszka, Barbara, Ewa, Krystyna, Elżbieta, Magdalena, Joanna, Aleksandra, Monika, Natalia, Karolina, Marta,
      Beata, Dorota, Iwona, Paulina, Weronika, Wiktoria, Agata`),
    family: list(`Nowak, Kowalski/Kowalska, Wiśniewski/Wiśniewska, Wójcik, Kowalczyk, Kamiński/Kamińska,
      Lewandowski/Lewandowska, Zieliński/Zielińska, Szymański/Szymańska, Woźniak, Dąbrowski/Dąbrowska,
      Kozłowski/Kozłowska, Jankowski/Jankowska, Mazur, Wojciechowski/Wojciechowska, Kwiatkowski/Kwiatkowska,
      Krawczyk, Kaczmarek, Piotrowski/Piotrowska, Grabowski/Grabowska, Zając, Pawłowski/Pawłowska,
      Michalski/Michalska, Król, Wieczorek, Jabłoński/Jabłońska, Wróbel, Nowakowski/Nowakowska, Majewski/Majewska,
      Olszewski/Olszewska, Stępień, Malinowski/Malinowska, Jaworski/Jaworska, Adamczyk, Dudek, Nowicki/Nowicka,
      Pawlak, Górski/Górska, Witkowski/Witkowska, Walczak, Sikora, Baran, Rutkowski/Rutkowska, Michalak, Szewczyk,
      Ostrowski/Ostrowska, Tomaszewski/Tomaszewska`),
  },
  NO: {
    male: list(`Jakob, Emil, Noah, Oliver, Filip, William, Lucas, Liam, Henrik, Oskar, Aksel, Theodor, Elias, Kasper,
      Magnus, Johannes, Isak, Mathias, Ole, Lars, Jan, Per, Bjørn, Knut, Arne, Svein, Thomas, Kristian, Andreas,
      Espen, Håkon, Sindre, Erik, Even`),
    female: list(`Nora, Emma, Ella, Maja, Olivia, Emilie, Sofie, Leah, Sara, Ingrid, Frida, Astrid, Thea, Ida, Hedda,
      Anne, Inger, Kari, Marit, Liv, Hilde, Silje, Kristin, Camilla, Ragnhild, Tone, Marte, Synnøve, Vilde, Selma,
      Tuva, Solveig`),
    family: list(`Hansen, Johansen, Olsen, Larsen, Andersen, Pedersen, Nilsen, Kristiansen, Jensen, Karlsen, Johnsen,
      Pettersen, Eriksen, Berg, Haugen, Hagen, Johannessen, Andreassen, Jacobsen, Dahl, Jørgensen, Halvorsen,
      Henriksen, Lund, Sørensen, Jakobsen, Moen, Gundersen, Iversen, Strand, Solberg, Svendsen, Martinsen, Eide,
      Knutsen, Paulsen, Bakken, Kristoffersen, Mathisen, Lie, Amundsen, Nguyen, Rasmussen, Ali, Lunde, Solheim,
      Berntsen, Holm, Ahmed`),
  },
  SE: {
    male: list(`William, Liam, Noah, Hugo, Lucas, Adam, Oliver, Elias, Alexander, Nils, Erik, Lars, Karl, Johan, Anders,
      Per, Mikael, Fredrik, Magnus, Björn, Gustav, Oscar, Viktor, Axel, Isak, Ludvig, Emil, Leo, Melvin, Sixten,
      Mohammed, Ali, Daniel, Henrik, Jonas`),
    female: list(`Alice, Maja, Vera, Elsa, Astrid, Wilma, Freja, Olivia, Ebba, Selma, Alma, Agnes, Saga, Lilly, Anna,
      Eva, Maria, Karin, Kristina, Lena, Kerstin, Ingrid, Sara, Emma, Linnea, Ida, Johanna, Malin, Sofia, Elin, Hanna,
      Louise, Ella, Klara`),
    family: list(`Andersson, Johansson, Karlsson, Nilsson, Eriksson, Larsson, Olsson, Persson, Svensson, Gustafsson,
      Pettersson, Jonsson, Jansson, Hansson, Bengtsson, Jönsson, Lindberg, Jakobsson, Magnusson, Lindström,
      Olofsson, Lindqvist, Lindgren, Berg, Axelsson, Bergström, Lundberg, Lind, Lundgren, Lundqvist, Mattsson,
      Berglund, Fredriksson, Sandberg, Henriksson, Forsberg, Sjöberg, Ali, Mohammed, Wallin, Engström, Eklund,
      Danielsson, Lundin, Håkansson, Björk, Bergman, Gunnarsson, Holm, Samuelsson, Fransson, Wikström, Isaksson,
      Ahmed, Hussein, Nyström`),
  },
  HR: {
    male: list(`Luka, Ivan, David, Jakov, Marko, Petar, Matej, Josip, Filip, Ante, Tomislav, Mario, Stjepan, Nikola,
      Karlo, Fran, Leon, Mateo, Dario, Hrvoje, Goran, Zoran, Davor, Krešimir, Damir, Igor, Dominik, Antonio, Lovro,
      Bruno`),
    female: list(`Mia, Lucija, Ana, Ema, Petra, Marija, Sara, Lana, Nika, Iva, Katarina, Ivana, Maja, Martina, Mateja,
      Tea, Lea, Elena, Marta, Dora, Klara, Mirjana, Snježana, Željka, Gordana, Vesna, Jelena, Nada, Ankica, Barbara`),
    family: list(`Horvat, Kovačević, Babić, Marić, Jurić, Novak, Kovačić, Knežević, Vuković, Marković, Petrović, Matić,
      Tomić, Pavlović, Kovač, Božić, Blažević, Grgić, Pavić, Radić, Perić, Filipović, Šarić, Lovrić, Vidović,
      Perković, Popović, Bošnjak, Jukić, Barišić, Đurđević, Mikulić, Vučković, Nikolić, Brkić, Šimić, Galić, Klarić,
      Rukavina, Lončar, Mandić`),
  },
  LU: {
    male: list(`Gabriel, Noah, Léo, Liam, Luca, Tom, Max, Ben, Paul, Lucas, Jean, Marc, Pierre, Luc, Michel, Claude,
      Yves, Romain, Gilles, Steve, Jeff, Pit, Joé, Tiago, João, Rui, Miguel, Bruno, Diogo, Kevin, Mike, Nico`),
    female: list(`Emma, Mia, Lara, Léa, Anna, Sofia, Elena, Lina, Zoé, Chloé, Marie, Anne, Sophie, Claire, Nathalie,
      Sandra, Carole, Martine, Josiane, Nadine, Monique, Lynn, Tessy, Joëlle, Mandy, Ana, Inês, Beatriz, Marta, Sara,
      Laura`),
    family: list(`Schmit, Muller, Weber, Wagner, Hoffmann, Thill, Schmitz, Klein, Schroeder, Reuter, Kremer, Becker,
      Meyer, Hansen, Faber, Kieffer, Weis, Schiltz, Majerus, Theis, Wagener, Feller, Ries, Welter, Goergen, Steffen,
      Back, Thoma, Kayser, Clemens, Da Silva, Dos Santos, Pereira, Ferreira, Fernandes, Rodrigues, Gonçalves, Martins,
      Costa, Lopes, Dupont, Martin, Bernard, Rossi, Weiler, Bintner, Hilbert`),
  },
  EE: {
    male: list(`Rasmus, Robin, Oliver, Sebastian, Martin, Mark, Markus, Kristjan, Karl, Andres, Jaan, Mart, Toomas, Tõnu,
      Rein, Jüri, Peeter, Priit, Margus, Indrek, Siim, Kaspar, Hendrik, Henri, Mihkel, Joosep, Artjom, Dmitri,
      Aleksei, Sergei, Rene, Tanel`),
    female: list(`Sofia, Mia, Eliise, Emma, Maria, Laura, Anna, Liis, Kati, Kadri, Kristiina, Triin, Piret, Mari, Tiina,
      Anu, Ene, Helen, Kerli, Merle, Maarja, Hanna, Lisandra, Elisabeth, Mirtel, Grete, Olga, Jelena, Natalja, Irina,
      Kätlin, Siiri`),
    family: list(`Tamm, Saar, Sepp, Mägi, Kask, Kukk, Rebane, Ilves, Pärn, Koppel, Luik, Lepik, Kaasik, Raudsepp, Vaher,
      Kuusk, Karu, Lill, Org, Kallas, Põder, Laur, Mets, Teder, Ivanov/Ivanova, Smirnov/Smirnova, Vasiliev/Vasilieva,
      Petrov/Petrova, Kuznetsov/Kuznetsova, Lepp, Kivi, Toom, Ots, Paju, Kõiv, Jõgi, Pihlak, Vares, Sild, Uibo, Rand,
      Aav, Kruus`),
  },
  SK: {
    male: list(`Jakub, Samuel, Michal, Adam, Tomáš, Martin, Lukáš, Matej, Filip, Peter, Ján, Jozef, Marek, Juraj,
      Miroslav, Ľubomír, Dušan, Milan, Štefan, Pavol, Roman, Rastislav, Branislav, Vladimír, Patrik, Dominik, Richard,
      Matúš, Šimon, Oliver, Marcel`),
    female: list(`Sofia, Ema, Nina, Natália, Viktória, Lucia, Simona, Petra, Mária, Anna, Zuzana, Katarína, Jana, Eva,
      Martina, Monika, Veronika, Barbora, Ivana, Michaela, Andrea, Dominika, Kristína, Alžbeta, Lenka, Gabriela,
      Silvia, Daniela, Adriana, Terézia, Laura`),
    family: list(`Horváth/Horváthová, Kováč/Kováčová, Varga/Vargová, Tóth/Tóthová, Nagy/Nagyová, Baláž/Balážová,
      Szabó/Szabóová, Molnár/Molnárová, Lukáč/Lukáčová, Novák/Nováková, Kollár/Kollárová, Németh/Némethová,
      Oravec/Oravcová, Šimko/Šimková, Polák/Poláková, Kráľ/Kráľová, Hudák/Hudáková, Mészáros/Mészárosová,
      Kováčik/Kováčiková, Hrnčiar/Hrnčiarová, Krajčovič/Krajčovičová, Gajdoš/Gajdošová, Marko/Marková,
      Kučera/Kučerová, Rusnák/Rusnáková, Blaho/Blahová, Pavlík/Pavlíková, Švec/Švecová, Mikuš/Mikušová,
      Bartoš/Bartošová, Cibula/Cibulová, Vrabec/Vrabcová, Jurík/Juríková, Dubovský/Dubovská, Kubiš/Kubišová,
      Baran/Baranová, Fábry/Fábryová, Lacko/Lacková, Sedlák/Sedláková, Žiak/Žiaková`),
  },
  TR: {
    male: list(`Yusuf, Eymen, Ömer, Mustafa, Ahmet, Mehmet, Ali, Hüseyin, Hasan, İbrahim, Murat, Emre, Burak, Can,
      Kerem, Arda, Deniz, Efe, Kaan, Barış, Serkan, Volkan, Onur, Oğuz, Uğur, Selim, Tolga, Cem, Emir, Alp`),
    female: list(`Zeynep, Elif, Defne, Asel, Eylül, Ayşe, Fatma, Emine, Hatice, Merve, Büşra, Esra, Özge, Gizem, Ceren,
      Damla, Ece, Selin, İrem, Melis, Sevgi, Gül, Nur, Derya, Pınar, Tuğba, Yasemin, Hande, Sibel, Aslı, Işıl`),
    family: list(`Yılmaz, Kaya, Demir, Şahin, Çelik, Yıldız, Yıldırım, Öztürk, Aydın, Özdemir, Arslan, Doğan, Kılıç,
      Aslan, Çetin, Kara, Koç, Kurt, Özkan, Şimşek, Polat, Korkmaz, Erdoğan, Özer, Aktaş, Güneş, Bulut, Akın, Tekin,
      Uçar, Karaca, Keskin, Erdem, Ünal, Işık, Avcı, Güler, Taş, Bozkurt, Sarı, Coşkun, Toprak, Aksoy, Kocabaş`),
  },
  PK: {
    male: list(`Muhammad, Ali, Ahmed, Hassan, Hussain, Bilal, Usman, Imran, Faisal, Kamran, Asif, Tariq, Zubair, Hamza,
      Saad, Umar, Fahad, Shahid, Waqas, Adnan, Junaid, Salman, Danish, Arslan, Haris, Rizwan, Naveed, Saqib, Talha,
      Zain, Abdullah, Yasir`),
    female: list(`Ayesha, Fatima, Zainab, Maryam, Sana, Hina, Amna, Sadia, Rabia, Saba, Nida, Mehwish, Iqra, Kiran,
      Sidra, Bushra, Asma, Samina, Nazia, Uzma, Farah, Hira, Mahnoor, Aiman, Areeba, Laiba, Anum, Sobia, Shazia, Rubina`),
    family: list(`Khan, Ahmed, Ali, Hussain, Shah, Malik, Butt, Chaudhry, Qureshi, Sheikh, Siddiqui, Iqbal, Raza, Akhtar,
      Javed, Mirza, Abbasi, Awan, Baig, Bhatti, Rana, Gill, Cheema, Jutt, Yousaf, Hashmi, Rizvi, Zaidi, Naqvi, Memon,
      Baloch, Khattak, Afridi, Durrani, Kazmi, Anwar, Aslam, Nawaz, Rehman, Saleem, Farooq, Tariq`),
  },
  PH: {
    male: list(`Jose, Juan, Mark, John, Michael, Christian, Jericho, Paolo, Miguel, Rafael, Carlo, Angelo, Joshua, Gabriel,
      Daniel, Ramon, Eduardo, Roberto, Ricardo, Antonio, Francisco, Jerome, Kenneth, Jayson, Rodel, Arnel, Ronaldo,
      Noel, Efren, Danilo`),
    female: list(`Maria, Ana, Kristine, Angelica, Jasmine, Princess, Nicole, Camille, Patricia, Rose, Grace, Joy, Mary,
      Andrea, Bea, Liza, Maricel, Jennifer, Lourdes, Teresa, Carmela, Kathleen, Michelle, Erlinda, Rowena, Marites,
      Rosalie, Cristina, Divina, Gemma, Josephine`),
    family: list(`Santos, Reyes, Cruz, Bautista, Ocampo, Garcia, Mendoza, Torres, Tomas, Andrada, Castillo, Flores,
      Villanueva, Ramos, Castro, Rivera, Aquino, Navarro, Salazar, Mercado, Dela Cruz, De Leon, Gonzales, Lopez,
      Pascual, Domingo, Soriano, Manalo, Dizon, Lim, Tan, Go, Sy, Gutierrez, Aguilar, Fernandez, Morales, Valdez,
      Concepcion, Mariano, Pangilinan, Bernardo, Lacson, Macaraeg`),
  },
  NG: {
    male: list(`Chinedu, Emeka, Obinna, Chukwuemeka, Ikenna, Uche, Tunde, Babatunde, Oluwaseun, Adebayo, Olumide, Segun,
      Femi, Kayode, Musa, Ibrahim, Abubakar, Usman, Aliyu, Sani, Yusuf, Bello, Daniel, David, Samuel, Emmanuel, Godwin,
      Victor, Chidi, Nnamdi, Kelechi`),
    female: list(`Ngozi, Chioma, Adaeze, Nkechi, Amaka, Ifeoma, Chiamaka, Funmilayo, Folake, Yetunde, Bukola, Temitope,
      Aisha, Fatima, Hauwa, Zainab, Amina, Halima, Blessing, Grace, Esther, Joy, Patience, Precious, Mercy, Omolara,
      Adunni, Ebere, Uchechi, Titilayo`),
    family: list(`Okafor, Okonkwo, Eze, Nwosu, Obi, Nwachukwu, Okeke, Chukwu, Adeyemi, Ogunleye, Olawale, Bakare,
      Balogun, Adewale, Akinola, Ojo, Afolabi, Abubakar, Mohammed, Ibrahim, Musa, Bello, Danjuma, Lawal, Garba,
      Suleiman, Yakubu, Okoro, Etim, Effiong, Bassey, Edet, Ekpo, Uzor, Ani, Igwe, Ndukwe, Oladipo, Oyewole, Shehu,
      Usman, Adeleke`),
  },
  VE: {
    male: list(`José, Luis, Carlos, Jesús, Juan, Miguel, Pedro, Rafael, Jorge, Gabriel, Daniel, Alejandro, Andrés, Ricardo,
      Fernando, Eduardo, Víctor, Manuel, Francisco, Antonio, Diego, Sebastián, Santiago, Samuel, Javier, Gustavo,
      Héctor, Oswaldo, Wilmer, Yonathan`),
    female: list(`María, Ana, Carmen, Luisa, Gabriela, Daniela, Valentina, Andrea, Mariana, Isabel, Yesenia, Yolanda,
      Rosa, Patricia, Carolina, Alejandra, Fernanda, Paola, Victoria, Sofía, Elena, Beatriz, Milagros, Yuleisy,
      Génesis, Oriana, Rebeca, Elizabeth, Josefina, Marisol`),
    family: list(`González, Rodríguez, Pérez, Hernández, García, Martínez, López, Díaz, Sánchez, Romero, Ramírez, Torres,
      Flores, Rojas, Morales, Medina, Gutiérrez, Mendoza, Castillo, Silva, Suárez, Contreras, Gómez, Fernández,
      Rivas, Blanco, Moreno, Herrera, Ramos, Vargas, Álvarez, Jiménez, Marcano, Rondón, Briceño, Salazar, Chacón,
      Villarroel, Guerrero, Montilla`),
  },
};

// ---------------------------------------------------------------------------- China (hanzi, pinyin)

export const CN_SURNAMES = pairs(`王 Wang, 李 Li, 张 Zhang, 刘 Liu, 陈 Chen, 杨 Yang, 黄 Huang, 赵 Zhao, 吴 Wu, 周 Zhou,
  徐 Xu, 孙 Sun, 马 Ma, 朱 Zhu, 胡 Hu, 郭 Guo, 何 He, 高 Gao, 林 Lin, 罗 Luo, 郑 Zheng, 梁 Liang, 谢 Xie, 宋 Song,
  唐 Tang, 韩 Han, 冯 Feng, 邓 Deng, 曹 Cao, 彭 Peng, 曾 Zeng, 肖 Xiao, 田 Tian, 董 Dong, 袁 Yuan, 潘 Pan, 于 Yu,
  蒋 Jiang, 蔡 Cai, 杜 Du, 叶 Ye, 程 Cheng, 苏 Su, 魏 Wei, 吕 Lyu, 丁 Ding, 任 Ren, 沈 Shen`);

export const CN_GIVEN = {
  male: pairs(`伟 Wei, 强 Qiang, 磊 Lei, 军 Jun, 洋 Yang, 勇 Yong, 杰 Jie, 涛 Tao, 明 Ming, 超 Chao, 浩然 Haoran,
    子轩 Zixuan, 宇轩 Yuxuan, 俊杰 Junjie, 建华 Jianhua, 志强 Zhiqiang, 文博 Wenbo, 一鸣 Yiming, 天佑 Tianyou,
    博文 Bowen, 鹏 Peng, 斌 Bin, 辉 Hui, 刚 Gang, 健 Jian, 晨 Chen, 昊天 Haotian, 思远 Siyuan, 家豪 Jiahao, 国强 Guoqiang`),
  female: pairs(`芳 Fang, 娜 Na, 敏 Min, 静 Jing, 丽 Li, 艳 Yan, 娟 Juan, 秀英 Xiuying, 婷 Ting, 雪 Xue, 欣怡 Xinyi,
    梓涵 Zihan, 诗涵 Shihan, 雨桐 Yutong, 佳怡 Jiayi, 子怡 Ziyi, 晓燕 Xiaoyan, 丽华 Lihua, 慧 Hui, 琳 Lin, 颖 Ying,
    倩 Qian, 玉兰 Yulan, 美玲 Meiling, 思琪 Siqi, 一诺 Yinuo, 梦洁 Mengjie, 桂英 Guiying, 海燕 Haiyan, 晶 Jing`),
};

// ---------------------------------------------------------------------------- Japan (kanji, Hepburn romaji, katakana)

export const JP_FAMILY = triples(`佐藤 Sato サトウ, 鈴木 Suzuki スズキ, 高橋 Takahashi タカハシ, 田中 Tanaka タナカ,
  伊藤 Ito イトウ, 渡辺 Watanabe ワタナベ, 山本 Yamamoto ヤマモト, 中村 Nakamura ナカムラ, 小林 Kobayashi コバヤシ,
  加藤 Kato カトウ, 吉田 Yoshida ヨシダ, 山田 Yamada ヤマダ, 佐々木 Sasaki ササキ, 山口 Yamaguchi ヤマグチ,
  松本 Matsumoto マツモト, 井上 Inoue イノウエ, 木村 Kimura キムラ, 林 Hayashi ハヤシ, 斎藤 Saito サイトウ,
  清水 Shimizu シミズ, 山崎 Yamazaki ヤマザキ, 森 Mori モリ, 池田 Ikeda イケダ, 橋本 Hashimoto ハシモト, 阿部 Abe アベ,
  石川 Ishikawa イシカワ, 山下 Yamashita ヤマシタ, 中島 Nakajima ナカジマ, 石井 Ishii イシイ, 小川 Ogawa オガワ,
  前田 Maeda マエダ, 岡田 Okada オカダ, 長谷川 Hasegawa ハセガワ, 藤田 Fujita フジタ, 後藤 Goto ゴトウ,
  近藤 Kondo コンドウ, 村上 Murakami ムラカミ, 遠藤 Endo エンドウ, 青木 Aoki アオキ, 坂本 Sakamoto サカモト`);

export const JP_GIVEN = {
  male: triples(`翔太 Shota ショウタ, 大輔 Daisuke ダイスケ, 健太 Kenta ケンタ, 拓也 Takuya タクヤ, 直樹 Naoki ナオキ,
    蓮 Ren レン, 悠真 Yuma ユウマ, 大翔 Hiroto ヒロト, 陽翔 Haruto ハルト, 湊 Minato ミナト, 樹 Itsuki イツキ,
    悠人 Yuto ユウト, 颯太 Sota ソウタ, 誠 Makoto マコト, 健一 Kenichi ケンイチ, 浩 Hiroshi ヒロシ, 隆 Takashi タカシ,
    和也 Kazuya カズヤ, 達也 Tatsuya タツヤ, 翼 Tsubasa ツバサ, 亮 Ryo リョウ, 拓海 Takumi タクミ,
    一郎 Ichiro イチロウ, 修 Osamu オサム, 剛 Tsuyoshi ツヨシ`),
  female: triples(`陽子 Yoko ヨウコ, 美咲 Misaki ミサキ, 結衣 Yui ユイ, さくら Sakura サクラ, 愛 Ai アイ, 恵子 Keiko ケイコ,
    陽菜 Hina ヒナ, 葵 Aoi アオイ, 凛 Rin リン, 芽依 Mei メイ, 結菜 Yuna ユナ, 莉子 Riko リコ, 美優 Miyu ミユ,
    彩 Aya アヤ, 真由美 Mayumi マユミ, 智子 Tomoko トモコ, 裕子 Yuko ユウコ, 由美 Yumi ユミ, 麻衣 Mai マイ,
    千尋 Chihiro チヒロ, 明美 Akemi アケミ, 奈々 Nana ナナ, 花 Hana ハナ, 香織 Kaori カオリ, 久美子 Kumiko クミコ`),
};

// ---------------------------------------------------------------------------- Russia (Cyrillic, Latin)

export const RU_GIVEN = {
  male: pairs(`Александр Alexander, Дмитрий Dmitry, Максим Maxim, Сергей Sergey, Андрей Andrey, Алексей Alexey,
    Иван Ivan, Михаил Mikhail, Артём Artyom, Николай Nikolay, Евгений Evgeny, Владимир Vladimir, Павел Pavel,
    Роман Roman, Кирилл Kirill, Олег Oleg, Денис Denis, Игорь Igor, Антон Anton, Юрий Yury, Виктор Viktor,
    Егор Egor, Тимофей Timofey, Григорий Grigory, Фёдор Fyodor`),
  female: pairs(`Анна Anna, Мария Maria, Елена Elena, Ольга Olga, Наталья Natalya, Татьяна Tatyana,
    Екатерина Ekaterina, Ирина Irina, Светлана Svetlana, Юлия Yulia, Анастасия Anastasia, Дарья Darya,
    Ксения Ksenia, Полина Polina, Виктория Viktoria, Алина Alina, Людмила Lyudmila, Галина Galina,
    Валентина Valentina, Софья Sofya, Вероника Veronika, Марина Marina, Надежда Nadezhda, Вера Vera, Алёна Alyona`),
};

/** Male forms; every entry ends in -ов/-ев/-ёв/-ин, so the female form just adds -а / -a. */
export const RU_FAMILY = pairs(`Иванов Ivanov, Смирнов Smirnov, Кузнецов Kuznetsov, Попов Popov, Васильев Vasilyev,
  Петров Petrov, Соколов Sokolov, Михайлов Mikhailov, Новиков Novikov, Фёдоров Fedorov, Морозов Morozov,
  Волков Volkov, Алексеев Alekseev, Лебедев Lebedev, Семёнов Semyonov, Егоров Egorov, Павлов Pavlov, Козлов Kozlov,
  Степанов Stepanov, Николаев Nikolaev, Орлов Orlov, Андреев Andreev, Макаров Makarov, Никитин Nikitin,
  Захаров Zakharov, Зайцев Zaitsev, Соловьёв Solovyov, Борисов Borisov, Яковлев Yakovlev, Григорьев Grigoryev,
  Романов Romanov, Воробьёв Vorobyov, Сергеев Sergeev, Кузьмин Kuzmin, Фролов Frolov, Александров Alexandrov,
  Дмитриев Dmitriev, Королёв Korolev, Гусев Gusev, Киселёв Kiselev`).map(([ru, en]) => [ru, `${ru}а`, en, `${en}a`] as const);

/** [Cyrillic male, Cyrillic female, Latin male, Latin female] */
export const RU_PATRONYMIC = list(`Александрович Александровна Alexandrovich Alexandrovna,
  Дмитриевич Дмитриевна Dmitrievich Dmitrievna, Сергеевич Сергеевна Sergeevich Sergeevna,
  Андреевич Андреевна Andreevich Andreevna, Иванович Ивановна Ivanovich Ivanovna,
  Михайлович Михайловна Mikhailovich Mikhailovna, Алексеевич Алексеевна Alexeevich Alexeevna,
  Владимирович Владимировна Vladimirovich Vladimirovna, Николаевич Николаевна Nikolaevich Nikolaevna,
  Евгеньевич Евгеньевна Evgenievich Evgenievna, Викторович Викторовна Viktorovich Viktorovna,
  Юрьевич Юрьевна Yurievich Yurievna, Олегович Олеговна Olegovich Olegovna, Павлович Павловна Pavlovich Pavlovna,
  Игоревич Игоревна Igorevich Igorevna, Петрович Петровна Petrovich Petrovna,
  Анатольевич Анатольевна Anatolievich Anatolievna, Борисович Борисовна Borisovich Borisovna,
  Валерьевич Валерьевна Valerievich Valerievna, Геннадьевич Геннадьевна Gennadievich Gennadievna`).map(
  (x) => x.split(/\s+/) as [string, string, string, string],
);

// ---------------------------------------------------------------------------- Iran (Persian, Latin)

export const IR_GIVEN = {
  male: pairs(`محمد Mohammad, علی Ali, حسین Hossein, رضا Reza, مهدی Mehdi, امیر Amir, آرش Arash, حسن Hassan,
    سعید Saeed, مجید Majid, بهرام Bahram, کوروش Kourosh, داریوش Dariush, پویا Pouya, فرهاد Farhad, کامران Kamran,
    بابک Babak, نیما Nima, سینا Sina, میلاد Milad, امید Omid, بهزاد Behzad, ایمان Iman, پرهام Parham, یاسین Yasin`),
  female: pairs(`فاطمه Fatemeh, زهرا Zahra, مریم Maryam, سارا Sara, نرگس Narges, لیلا Leila, شیرین Shirin,
    نازنین Nazanin, الهام Elham, مینا Mina, پریسا Parisa, نیلوفر Niloufar, سمیرا Samira, آزاده Azadeh, مهسا Mahsa,
    ستاره Setareh, یاسمن Yasaman, هانیه Hanieh, کیمیا Kimia, رها Raha, فرشته Fereshteh, ژاله Zhaleh, پروین Parvin,
    سحر Sahar, آیدا Aida`),
};

export const IR_FAMILY = pairs(`محمدی Mohammadi, حسینی Hosseini, احمدی Ahmadi, رضایی Rezaei, کریمی Karimi,
  موسوی Mousavi, جعفری Jafari, رحیمی Rahimi, صادقی Sadeghi, حیدری Heidari, کاظمی Kazemi, قاسمی Ghasemi, نوری Nouri,
  ابراهیمی Ebrahimi, اکبری Akbari, هاشمی Hashemi, عباسی Abbasi, سلطانی Soltani, طاهری Taheri, یزدانی Yazdani,
  تهرانی Tehrani, شریفی Sharifi, نجفی Najafi, امینی Amini, زارعی Zarei, بهرامی Bahrami, فرهادی Farhadi,
  کرمانی Kermani, اصفهانی Esfahani, میرزایی Mirzaei`);

// ---------------------------------------------------------------------------- Greece (Greek, Latin per ELOT 743)

export const GR_GIVEN = {
  male: pairs(`Γιώργος Giorgos, Δημήτρης Dimitris, Κωνσταντίνος Konstantinos, Γιάννης Giannis, Νίκος Nikos,
    Παναγιώτης Panagiotis, Βασίλης Vasilis, Χρήστος Christos, Αθανάσιος Athanasios, Μιχάλης Michalis,
    Ευάγγελος Evangelos, Σπύρος Spyros, Αντώνης Antonis, Ανδρέας Andreas, Αλέξανδρος Alexandros, Στέλιος Stelios,
    Θοδωρής Thodoris, Πέτρος Petros, Λευτέρης Lefteris, Άγγελος Angelos, Μανώλης Manolis, Σταύρος Stavros,
    Ηλίας Ilias, Φώτης Fotis, Άρης Aris`),
  female: pairs(`Μαρία Maria, Ελένη Eleni, Αικατερίνη Aikaterini, Βασιλική Vasiliki, Σοφία Sofia, Αγγελική Angeliki,
    Γεωργία Georgia, Δήμητρα Dimitra, Κωνσταντίνα Konstantina, Παρασκευή Paraskevi, Χριστίνα Christina,
    Ευαγγελία Evangelia, Ιωάννα Ioanna, Αναστασία Anastasia, Ζωή Zoi, Δέσποινα Despoina, Ειρήνη Eirini, Αθηνά Athina,
    Νικολέτα Nikoleta, Φωτεινή Foteini, Ελπίδα Elpida, Σταυρούλα Stavroula, Κατερίνα Katerina, Αλεξάνδρα Alexandra,
    Μαρίνα Marina`),
};
/** "native latin"; gendered entries use "male/female" on both sides. */
export const GR_FAMILY = pairs(`Παπαδόπουλος/Παπαδοπούλου Papadopoulos/Papadopoulou, Παπαδάκης/Παπαδάκη Papadakis/Papadaki,
  Νικολάου Nikolaou, Γεωργίου Georgiou, Παπαγεωργίου Papageorgiou, Οικονόμου Oikonomou, Βασιλείου Vasileiou,
  Ιωάννου Ioannou, Κωνσταντίνου Konstantinou, Δημητρίου Dimitriou, Αντωνίου Antoniou, Παπανικολάου Papanikolaou,
  Μακρής/Μακρή Makris/Makri, Καραγιάννης/Καραγιάννη Karagiannis/Karagianni, Παππάς/Παππά Pappas/Pappa,
  Αθανασίου Athanasiou, Χριστοδούλου Christodoulou, Λαμπρόπουλος/Λαμπροπούλου Lampropoulos/Lampropoulou,
  Αναγνώστου Anagnostou, Κωνσταντινίδης/Κωνσταντινίδου Konstantinidis/Konstantinidou, Παπαδημητρίου Papadimitriou,
  Σταθόπουλος/Σταθοπούλου Stathopoulos/Stathopoulou, Μιχαηλίδης/Μιχαηλίδου Michailidis/Michailidou,
  Ζαχαρίου Zachariou, Πετρόπουλος/Πετροπούλου Petropoulos/Petropoulou, Θεοδωρίδης/Θεοδωρίδου Theodoridis/Theodoridou,
  Κυριακίδης/Κυριακίδου Kyriakidis/Kyriakidou, Σαββίδης/Σαββίδου Savvidis/Savvidou, Τσακίρης/Τσακίρη Tsakiris/Tsakiri,
  Δημόπουλος/Δημοπούλου Dimopoulos/Dimopoulou, Ρήγας/Ρήγα Rigas/Riga, Αλεξίου Alexiou,
  Γεωργακόπουλος/Γεωργακοπούλου Georgakopoulos/Georgakopoulou, Σπυρόπουλος/Σπυροπούλου Spyropoulos/Spyropoulou,
  Βλάχος/Βλάχου Vlachos/Vlachou, Αγγελόπουλος/Αγγελοπούλου Angelopoulos/Angelopoulou, Μαυρίδης/Μαυρίδου Mavridis/Mavridou,
  Κουτσούκος/Κουτσούκου Koutsoukos/Koutsoukou, Ξανθόπουλος/Ξανθοπούλου Xanthopoulos/Xanthopoulou, Πολυχρόνης/Πολυχρόνη Polychronis/Polychroni`);

// ---------------------------------------------------------------------------- Ukraine (Ukrainian, official KMU 2010 Latin)

export const UA_GIVEN = {
  male: pairs(`Олександр Oleksandr, Андрій Andrii, Сергій Serhii, Дмитро Dmytro, Володимир Volodymyr, Іван Ivan,
    Микола Mykola, Максим Maksym, Олег Oleh, Юрій Yurii, Віктор Viktor, Тарас Taras, Богдан Bohdan, Василь Vasyl,
    Петро Petro, Михайло Mykhailo, Артем Artem, Денис Denys, Ігор Ihor, Роман Roman, Євген Yevhen, Віталій Vitalii,
    Анатолій Anatolii, Ярослав Yaroslav, Остап Ostap`),
  female: pairs(`Олена Olena, Наталія Nataliia, Тетяна Tetiana, Ірина Iryna, Оксана Oksana, Юлія Yuliia, Марія Mariia,
    Анна Anna, Світлана Svitlana, Людмила Liudmyla, Катерина Kateryna, Ольга Olha, Галина Halyna, Вікторія Viktoriia,
    Анастасія Anastasiia, Дарина Daryna, Софія Sofiia, Христина Khrystyna, Леся Lesia, Валентина Valentyna,
    Надія Nadiia, Яна Yana, Зоряна Zoriana, Богдана Bohdana, Марина Maryna`),
};
export const UA_FAMILY = pairs(`Шевченко Shevchenko, Коваленко Kovalenko, Бондаренко Bondarenko, Ткаченко Tkachenko,
  Кравченко Kravchenko, Олійник Oliinyk, Шевчук Shevchuk, Поліщук Polishchuk, Бойко Boiko, Ткачук Tkachuk,
  Мельник Melnyk, Савченко Savchenko, Руденко Rudenko, Лисенко Lysenko, Марченко Marchenko, Мороз Moroz,
  Петренко Petrenko, Клименко Klymenko, Павленко Pavlenko, Кузьменко Kuzmenko, Левченко Levchenko,
  Гончаренко Honcharenko, Кравчук Kravchuk, Савчук Savchuk, Романюк Romaniuk, Кушнір Kushnir, Ковальчук Kovalchuk,
  Литвиненко Lytvynenko, Карпенко Karpenko, Іваненко Ivanenko, Козак Kozak, Кравець Kravets, Гнатюк Hnatiuk,
  Ковальський/Ковальська Kovalskyi/Kovalska, Савицький/Савицька Savytskyi/Savytska, Захарченко Zakharchenko,
  Білик Bilyk, Яковенко Yakovenko, Сидоренко Sydorenko, Пономаренко Ponomarenko`);
/** [Cyrillic male, Cyrillic female, Latin male, Latin female] */
export const UA_PATRONYMIC = list(`Олександрович Олександрівна Oleksandrovych Oleksandrivna,
  Андрійович Андріївна Andriiovych Andriivna, Сергійович Сергіївна Serhiiovych Serhiivna,
  Дмитрович Дмитрівна Dmytrovych Dmytrivna, Володимирович Володимирівна Volodymyrovych Volodymyrivna,
  Іванович Іванівна Ivanovych Ivanivna, Миколайович Миколаївна Mykolaiovych Mykolaivna,
  Петрович Петрівна Petrovych Petrivna, Васильович Василівна Vasylovych Vasylivna,
  Михайлович Михайлівна Mykhailovych Mykhailivna, Юрійович Юріївна Yuriiovych Yuriivna,
  Вікторович Вікторівна Viktorovych Viktorivna, Богданович Богданівна Bohdanovych Bohdanivna,
  Олегович Олегівна Olehovych Olehivna, Анатолійович Анатоліївна Anatoliiovych Anatoliivna`).map(
  (x) => x.split(/\s+/) as [string, string, string, string],
);

// ---------------------------------------------------------------------------- Belarus (Belarusian, Latin)

export const BY_GIVEN = {
  male: pairs(`Аляксандр Aliaksandr, Дзмітрый Dzmitry, Сяргей Siarhei, Андрэй Andrei, Аляксей Aliaksei, Іван Ivan,
    Мікалай Mikalai, Уладзімір Uladzimir, Віктар Viktar, Павел Pavel, Максім Maksim, Ігар Ihar, Юрый Yury,
    Міхаіл Mikhail, Арцём Artsiom, Яўген Yauhen, Раман Raman, Вадзім Vadzim, Кірыл Kiryl, Алег Aleh`),
  female: pairs(`Алена Alena, Вольга Volha, Наталля Natallia, Таццяна Tatsiana, Ірына Iryna, Ганна Hanna,
    Марыя Maryia, Юлія Yuliya, Святлана Sviatlana, Кацярына Katsiaryna, Вікторыя Viktoryia, Анастасія Anastasiya,
    Дарына Daryna, Ксенія Kseniya, Людміла Liudmila, Галіна Halina, Валянціна Valiantsina, Надзея Nadzeya,
    Вераніка Veranika, Марына Maryna`),
};
export const BY_FAMILY = pairs(`Іваноў/Іванова Ivanou/Ivanova, Новік Novik, Кавалёў/Кавалёва Kavaliou/Kavaliova,
  Козлаў/Козлава Kozlau/Kozlava, Шыманскі/Шыманская Shymanski/Shymanskaya, Мельнік Melnik,
  Казлоўскі/Казлоўская Kazlouski/Kazlouskaya, Каваленка Kavalenka, Бондар Bondar, Кравец Kravets,
  Макарэвіч Makarevich, Марозаў/Марозава Marozau/Marozava, Петрыкевіч Petrykevich, Лукашэвіч Lukashevich,
  Тарасевіч Tarasevich, Жук Zhuk, Сідарэнка Sidarenka, Пашкевіч Pashkevich, Мароз Maroz, Шаўчук Shauchuk,
  Савіцкі/Савіцкая Savitski/Savitskaya, Быкаў/Быкава Bykau/Bykava, Дубовік Dubovik, Рамановіч Ramanovich,
  Кароль Karol, Лапіцкі/Лапіцкая Lapitski/Lapitskaya, Васілеўскі/Васілеўская Vasileuski/Vasileuskaya,
  Карпенка Karpenka, Сямёнаў/Сямёнава Siamionau/Siamionava, Грыгаровіч Hryharovich`);
/** [Cyrillic male, Cyrillic female, Latin male, Latin female] */
export const BY_PATRONYMIC = list(`Аляксандравіч Аляксандраўна Aliaksandravich Aliaksandrauna,
  Сяргеевіч Сяргееўна Siarheyevich Siarheyeuna, Уладзіміравіч Уладзіміраўна Uladzimiravich Uladzimirauna,
  Мікалаевіч Мікалаеўна Mikalayevich Mikalayeuna, Іванавіч Іванаўна Ivanavich Ivanauna,
  Віктаравіч Віктараўна Viktaravich Viktarauna, Пятровіч Пятроўна Piatrovich Piatrouna,
  Міхайлавіч Міхайлаўна Mikhailavich Mikhailauna, Андрэевіч Андрэеўна Andreyevich Andreyeuna,
  Паўлавіч Паўлаўна Paulavich Paulauna`).map((x) => x.split(/\s+/) as [string, string, string, string]);

// ---------------------------------------------------------------------------- Israel (Hebrew, Latin)

export const IL_GIVEN = {
  male: pairs(`יוסף Yosef, דוד David, משה Moshe, אברהם Avraham, יצחק Yitzhak, יעקב Yaakov, דניאל Daniel, איתי Itai,
    נועם Noam, אורי Uri, עומר Omer, יונתן Yonatan, אריאל Ariel, עידו Ido, רון Ron, גיא Guy, אייל Eyal, אמיר Amir,
    תומר Tomer, שמואל Shmuel, אלון Alon, רועי Roi, עמית Amit, מוחמד Mohammad, אחמד Ahmad`),
  female: pairs(`שרה Sarah, רחל Rachel, מרים Miriam, נועה Noa, תמר Tamar, מאיה Maya, יעל Yael, שירה Shira,
    אביגיל Avigail, הילה Hila, מיכל Michal, רוני Roni, ליה Lia, אסתר Esther, רבקה Rivka, לאה Leah, דנה Dana, עדי Adi,
    טל Tal, אורית Orit, ענבל Inbal, גלית Galit, נטע Neta, פאטמה Fatma, ריים Reem`),
};
export const IL_FAMILY = pairs(`כהן Cohen, לוי Levi, מזרחי Mizrahi, פרץ Peretz, ביטון Biton, דהן Dahan,
  אברהם Avraham, פרידמן Friedman, מלכה Malka, אזולאי Azoulay, כץ Katz, יוסף Yosef, עמר Amar, אוחיון Ohayon,
  חדד Hadad, גבאי Gabay, שפירא Shapira, אשכנזי Ashkenazi, רוזנברג Rosenberg, גולדברג Goldberg, וייס Weiss,
  שלום Shalom, ברק Barak, סעדה Saada, חורי Khoury, נסאר Nassar, עזאם Azzam, אלמוג Almog, שמעוני Shimoni,
  גרינברג Greenberg, טל Tal, בן־חיים Ben-Haim`);

// ---------------------------------------------------------------------------- South Korea (Hangul, passport romanisation)

export const KR_FAMILY = pairs(`김 Kim, 이 Lee, 박 Park, 최 Choi, 정 Jung, 강 Kang, 조 Cho, 윤 Yoon, 장 Jang, 임 Lim,
  한 Han, 오 Oh, 서 Seo, 신 Shin, 권 Kwon, 황 Hwang, 안 Ahn, 송 Song, 류 Ryu, 전 Jeon, 홍 Hong, 고 Ko, 문 Moon,
  양 Yang, 손 Son, 배 Bae, 백 Baek, 허 Heo, 유 Yoo, 남 Nam`);
export const KR_GIVEN = {
  male: pairs(`민준 Min-jun, 서준 Seo-jun, 도윤 Do-yun, 예준 Ye-jun, 시우 Si-woo, 하준 Ha-jun, 지호 Ji-ho, 주원 Ju-won,
    지훈 Ji-hoon, 현우 Hyun-woo, 성민 Sung-min, 동현 Dong-hyun, 준호 Jun-ho, 영호 Young-ho, 상철 Sang-cheol,
    정훈 Jung-hoon, 재현 Jae-hyun, 승우 Seung-woo, 태현 Tae-hyun, 민수 Min-su, 우진 Woo-jin, 건우 Gun-woo,
    진우 Jin-woo, 성호 Sung-ho, 광수 Kwang-su`),
  female: pairs(`서연 Seo-yeon, 서윤 Seo-yun, 지우 Ji-woo, 하윤 Ha-yun, 민서 Min-seo, 하은 Ha-eun, 지민 Ji-min,
    수빈 Su-bin, 지은 Ji-eun, 수진 Su-jin, 미영 Mi-young, 은지 Eun-ji, 혜진 Hye-jin, 영희 Young-hee, 민지 Min-ji,
    유진 Yu-jin, 예린 Ye-rin, 소연 So-yeon, 다은 Da-eun, 지현 Ji-hyun, 은영 Eun-young, 정희 Jung-hee, 미숙 Mi-suk,
    선영 Sun-young, 채원 Chae-won`),
};

// ---------------------------------------------------------------------------- Gulf (Arabic, Latin)

export const AR_GIVEN = {
  male: pairs(`محمد Mohammed, أحمد Ahmed, عبدالله Abdullah, خالد Khalid, سلطان Sultan, راشد Rashid, سعيد Saeed,
    حمدان Hamdan, منصور Mansour, فيصل Faisal, عمر Omar, علي Ali, يوسف Yousef, ماجد Majid, سيف Saif, حمد Hamad,
    عبدالرحمن Abdulrahman, فهد Fahad, ناصر Nasser, تركي Turki, سعود Saud, بندر Bandar, نايف Nayef, زايد Zayed,
    مبارك Mubarak`),
  female: pairs(`فاطمة Fatima, مريم Maryam, عائشة Aisha, نورة Noura, سارة Sara, حصة Hessa, شيخة Sheikha, موزة Moza,
    ريم Reem, لطيفة Latifa, هند Hind, منى Mona, أمل Amal, دانة Dana, العنود Alanoud, لولوة Lulwa, نوف Nouf,
    جواهر Jawaher, غادة Ghada, ليلى Layla, هيا Haya, روان Rawan, شهد Shahad, رنا Rana, عبير Abeer`),
};
export const AE_FAMILY = pairs(`المنصوري Al-Mansoori, الكعبي Al-Kaabi, الظاهري Al-Dhaheri, النعيمي Al-Nuaimi,
  الشامسي Al-Shamsi, المزروعي Al-Mazrouei, الهاشمي Al-Hashimi, الفلاسي Al-Falasi, السويدي Al-Suwaidi,
  المهيري Al-Muhairi, الكتبي Al-Ketbi, البلوشي Al-Balushi, القاسمي Al-Qasimi, الرميثي Al-Romaithi, العامري Al-Ameri,
  الحمادي Al-Hammadi, الشحي Al-Shehhi, الزعابي Al-Zaabi, الغفلي Al-Ghafli, المري Al-Marri`);
export const SA_FAMILY = pairs(`القحطاني Al-Qahtani, العتيبي Al-Otaibi, الغامدي Al-Ghamdi, الشهري Al-Shehri,
  الدوسري Al-Dosari, الحربي Al-Harbi, الزهراني Al-Zahrani, المطيري Al-Mutairi, العنزي Al-Anazi, الشمري Al-Shammari,
  السبيعي Al-Subaie, العمري Al-Omari, السهلي Al-Sahli, البقمي Al-Buqami, الرشيدي Al-Rashidi, الجهني Al-Juhani,
  الأحمدي Al-Ahmadi, المالكي Al-Malki, الخالدي Al-Khalidi, الفيفي Al-Faifi, السلمي Al-Sulami, التميمي Al-Tamimi`);
