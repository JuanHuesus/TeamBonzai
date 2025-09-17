import { http, HttpResponse } from "msw";
import type { ListedService, User } from "../types";

// --- Mock-datat (pienet samplet) ---
const users: User[] = [
  {
    "id": "cd9244d5-be21-44c6-a952-e63e58610067",
    "firstname": "Aino",
    "surname": "Koskinen",
    "email": "aino.koskinen@example.com",
    "phone_number": "+358451258176",
    "description": "Aino Koskinen opettaa ja vetää työpajoja. Kokemusta 10+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/99/400/400",
    "created": "2025-01-29T03:09:18Z",
    "updated": "2025-11-15T22:49:52Z"
  },
  {
    "id": "290efadb-72d1-46a5-9c81-777aa0f7b0cf",
    "firstname": "Mikko",
    "surname": "Laine",
    "email": "mikko.laine@example.com",
    "phone_number": "+358478198702",
    "description": "Mikko Laine opettaa ja vetää työpajoja. Kokemusta 7+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/119/400/400",
    "created": "2025-12-20T07:03:23Z",
    "updated": "2025-07-17T01:38:37Z"
  },
  {
    "id": "041d312b-16fd-435a-ad4f-064a4978eb89",
    "firstname": "Sara",
    "surname": "Hietala",
    "email": "sara.hietala@example.com",
    "phone_number": "+358437139317",
    "description": "Sara Hietala opettaa ja vetää työpajoja. Kokemusta 3+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/889/400/400",
    "created": "2025-06-12T09:38:49Z",
    "updated": "2025-01-28T03:05:59Z"
  },
  {
    "id": "800af5dc-6a25-4f1d-868b-a98a31dd93da",
    "firstname": "Ella",
    "surname": "Manninen",
    "email": "ella.manninen@example.com",
    "phone_number": "+358440195119",
    "description": "Ella Manninen opettaa ja vetää työpajoja. Kokemusta 10+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/122/400/400",
    "created": "2025-11-18T02:49:13Z",
    "updated": "2025-08-08T14:24:37Z"
  },
  {
    "id": "dbf7c028-4850-43bb-88b0-bbdafa4f00f7",
    "firstname": "Omar",
    "surname": "Rahman",
    "email": "omar.rahman@example.com",
    "phone_number": "+358425334083",
    "description": "Omar Rahman opettaa ja vetää työpajoja. Kokemusta 3+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/813/400/400",
    "created": "2025-01-20T06:12:21Z",
    "updated": "2025-03-27T20:37:55Z"
  },
  {
    "id": "b7b3b846-25b6-4521-8dc9-a1094cc95018",
    "firstname": "Jari",
    "surname": "Virtanen",
    "email": "jari.virtanen@example.com",
    "phone_number": "+358415683705",
    "description": "Jari Virtanen opettaa ja vetää työpajoja. Kokemusta 5+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/594/400/400",
    "created": "2025-06-12T18:39:32Z",
    "updated": "2025-02-26T00:33:17Z"
  },
  {
    "id": "e4c19fff-da41-41cf-81c8-644110405b6a",
    "firstname": "Liisa",
    "surname": "Korhonen",
    "email": "liisa.korhonen@example.com",
    "phone_number": "+358479223514",
    "description": "Liisa Korhonen opettaa ja vetää työpajoja. Kokemusta 7+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/371/400/400",
    "created": "2025-02-10T00:32:55Z",
    "updated": "2025-08-14T20:54:23Z"
  },
  {
    "id": "d8e1afe9-105b-4f9f-b051-2ed1fbf9999c",
    "firstname": "Noora",
    "surname": "Salmi",
    "email": "noora.salmi@example.com",
    "phone_number": "+358483769949",
    "description": "Noora Salmi opettaa ja vetää työpajoja. Kokemusta 5+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/763/400/400",
    "created": "2025-02-07T20:07:07Z",
    "updated": "2025-08-01T17:20:54Z"
  },
  {
    "id": "081d30fd-6a41-4f5e-a6dd-2fc0304ae2c3",
    "firstname": "Ville",
    "surname": "Heikkinen",
    "email": "ville.heikkinen@example.com",
    "phone_number": "+358418691783",
    "description": "Ville Heikkinen opettaa ja vetää työpajoja. Kokemusta 3+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/422/400/400",
    "created": "2025-07-12T18:55:06Z",
    "updated": "2025-09-22T05:47:14Z"
  },
  {
    "id": "65d1f996-c9df-4fb2-93d4-911c5e65040a",
    "firstname": "Sami",
    "surname": "Lehtinen",
    "email": "sami.lehtinen@example.com",
    "phone_number": "+358478548363",
    "description": "Sami Lehtinen opettaa ja vetää työpajoja. Kokemusta 7+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/954/400/400",
    "created": "2025-08-16T09:49:55Z",
    "updated": "2025-12-25T15:05:51Z"
  },
  {
    "id": "9e11d30d-5d02-4eb9-8fdf-8bc83b1f6805",
    "firstname": "Kaisa",
    "surname": "Niemi",
    "email": "kaisa.niemi@example.com",
    "phone_number": "+358468479146",
    "description": "Kaisa Niemi opettaa ja vetää työpajoja. Kokemusta 7+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/509/400/400",
    "created": "2025-11-05T12:09:12Z",
    "updated": "2025-03-11T19:32:51Z"
  },
  {
    "id": "017eb044-1ffb-48d5-818e-7cef7bb417bc",
    "firstname": "Janne",
    "surname": "Mäkinen",
    "email": "janne.mäkinen@example.com",
    "phone_number": "+358499917710",
    "description": "Janne Mäkinen opettaa ja vetää työpajoja. Kokemusta 5+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/168/400/400",
    "created": "2025-08-12T02:01:01Z",
    "updated": "2025-04-27T14:31:28Z"
  },
  {
    "id": "12e35d3b-4b22-4e8a-98fc-d26059452a94",
    "firstname": "Tuuli",
    "surname": "Saarinen",
    "email": "tuuli.saarinen@example.com",
    "phone_number": "+358477619167",
    "description": "Tuuli Saarinen opettaa ja vetää työpajoja. Kokemusta 7+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/920/400/400",
    "created": "2025-04-22T19:46:28Z",
    "updated": "2025-08-25T11:54:33Z"
  },
  {
    "id": "357b709e-11ce-4912-a750-a09e46fb19eb",
    "firstname": "Leo",
    "surname": "Pitkänen",
    "email": "leo.pitkänen@example.com",
    "phone_number": "+358419223800",
    "description": "Leo Pitkänen opettaa ja vetää työpajoja. Kokemusta 10+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/338/400/400",
    "created": "2025-10-22T01:03:53Z",
    "updated": "2025-05-13T20:11:28Z"
  },
  {
    "id": "1d0e6a85-c9fd-49a4-84c6-2294f82ea8c0",
    "firstname": "Emilia",
    "surname": "Kallio",
    "email": "emilia.kallio@example.com",
    "phone_number": "+358429612714",
    "description": "Emilia Kallio opettaa ja vetää työpajoja. Kokemusta 10+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "default",
    "profile_image": "https://picsum.photos/id/81/400/400",
    "created": "2025-09-17T12:13:23Z",
    "updated": "2025-01-31T03:28:31Z"
  },
  {
    "id": "bc7a6061-7b73-4e88-aa7d-324845a9cc23",
    "firstname": "Eero",
    "surname": "Järvinen",
    "email": "eero.järvinen@example.com",
    "phone_number": "+358481700861",
    "description": "Eero Järvinen opettaa ja vetää työpajoja. Kokemusta 7+ vuotta.",
    "hashed_password": "$2b$10$abcdefghijklmnopqrstuv",
    "user_role": "admin",
    "profile_image": "https://picsum.photos/id/697/400/400",
    "created": "2025-09-28T00:37:21Z",
    "updated": "2025-05-16T23:53:56Z"
  }
];

let services: ListedService[] = [
  {
    "id": "5c15639e-5355-40aa-9a2e-e4d307ae5a3d",
    "name": "1:1 Pianon alkeet",
    "description": "1:1 Improvisaatio. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-09-15T22:20:50Z",
    "location": "https://zoom.example.com/session-848",
    "service_provider": "Eero Järvinen",
    "listing_creator": "Emilia Kallio",
    "price": "€29",
    "service_type": "1on1",
    "attendee_limit": "1",
    "service_category": "music",
    "image": "https://picsum.photos/id/635/1200/630",
    "created": "2025-09-09T07:40:41Z",
    "updated": "2025-08-13T10:50:57Z"
  },
  {
    "id": "aaccab93-00f1-4f5b-b902-111924fa6dc6",
    "name": "Saviruukku-paja – muistikortit",
    "description": "Dreijaus alkeet – muistikortit. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-05-19T01:09:56Z",
    "location": "https://zoom.example.com/lesson-219",
    "service_provider": "Emilia Kallio",
    "listing_creator": "Sami Lehtinen",
    "price": "€34",
    "service_type": "study material",
    "attendee_limit": "unlimited",
    "service_category": "pottery",
    "image": "https://picsum.photos/id/1012/1200/630",
    "created": "2025-01-23T21:29:42Z",
    "updated": "2025-03-26T17:50:37Z"
  },
  {
    "id": "44cf49b8-5522-4fd8-8fc2-5e71051a3b02",
    "name": "TypeScript peruskurssi",
    "description": "TypeScript peruskurssi. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-08-02T09:09:04Z",
    "location": "https://meet.example.com/session-938",
    "service_provider": "Sami Lehtinen",
    "listing_creator": "Omar Rahman",
    "price": "Free",
    "service_type": "live seminar/lesson",
    "attendee_limit": "20",
    "service_category": "coding",
    "image": "https://picsum.photos/id/882/1200/630",
    "created": "2025-12-02T12:55:08Z",
    "updated": "2025-08-02T16:25:04Z"
  },
  {
    "id": "3fc4f68d-7ac7-43ca-b221-3eaa5a0d037b",
    "name": "IELTS Speaking (pre-recorded)",
    "description": "IELTS Speaking (pre-recorded). Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-02-02T05:28:24Z",
    "location": "https://zoom.example.com/session-337",
    "service_provider": "Ville Heikkinen",
    "listing_creator": "Leo Pitkänen",
    "price": "€36",
    "service_type": "pre-recorded",
    "attendee_limit": "unlimited",
    "service_category": "english",
    "image": "https://picsum.photos/id/478/1200/630",
    "created": "2025-01-05T16:26:09Z",
    "updated": "2025-07-08T08:10:48Z"
  },
  {
    "id": "fd573579-14c2-401e-b9cf-76946272d6ee",
    "name": "Lempeä iltavirtaus (pre-recorded)",
    "description": "Lempeä iltavirtaus (pre-recorded). Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-08-25T19:51:49Z",
    "location": "https://teams.example.com/workshop-228",
    "service_provider": "Jari Virtanen",
    "listing_creator": "Ville Heikkinen",
    "price": "Free",
    "service_type": "pre-recorded",
    "attendee_limit": "unlimited",
    "service_category": "yoga",
    "image": "https://picsum.photos/id/1056/1200/630",
    "created": "2025-08-28T20:22:53Z",
    "updated": "2025-09-12T08:43:47Z"
  },
  {
    "id": "4318cbb0-c1d9-49f7-9cfd-703bebdbb321",
    "name": "Kuvaus alkeet – muistikortit",
    "description": "Lightroom pikakurssi – muistikortit. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-09-04T08:00:26Z",
    "location": "https://meet.example.com/session-295",
    "service_provider": "Mikko Laine",
    "listing_creator": "Emilia Kallio",
    "price": "€37",
    "service_type": "study material",
    "attendee_limit": "unlimited",
    "service_category": "photography",
    "image": "https://picsum.photos/id/138/1200/630",
    "created": "2025-03-23T01:48:50Z",
    "updated": "2025-06-21T02:56:24Z"
  },
  {
    "id": "803c2f21-f8b1-4614-81c0-2467d510e56e",
    "name": "Aamumeditaatio (pre-recorded)",
    "description": "Aamumeditaatio (pre-recorded). Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-07-28T09:38:55Z",
    "location": "https://zoom.example.com/workshop-728",
    "service_provider": "Jari Virtanen",
    "listing_creator": "Ella Manninen",
    "price": "€18",
    "service_type": "pre-recorded",
    "attendee_limit": "unlimited",
    "service_category": "wellness",
    "image": "https://picsum.photos/id/53/1200/630",
    "created": "2025-01-28T07:23:19Z",
    "updated": "2025-12-06T13:22:06Z"
  },
  {
    "id": "f4c83732-7560-4874-aef8-9f0a1ee1d731",
    "name": "Kasvisruokaa kotona",
    "description": "Kasvisruokaa kotona. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-11-26T16:39:56Z",
    "location": "Koulukatu 3, 20100 Turku",
    "service_provider": "Liisa Korhonen",
    "listing_creator": "Tuuli Saarinen",
    "price": "€42",
    "service_type": "live seminar/lesson",
    "attendee_limit": "15",
    "service_category": "cooking",
    "image": "https://picsum.photos/id/955/1200/630",
    "created": "2025-07-06T13:36:24Z",
    "updated": "2025-07-07T21:39:57Z"
  },
  {
    "id": "d85348f3-430b-4da6-9442-d2326b83df8d",
    "name": "Yhtälöt haltuun",
    "description": "Yhtälöt haltuun. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-03-21T16:44:32Z",
    "location": "https://teams.example.com/workshop-250",
    "service_provider": "Sami Lehtinen",
    "listing_creator": "Sara Hietala",
    "price": "€42",
    "service_type": "live seminar/lesson",
    "attendee_limit": "15",
    "service_category": "math",
    "image": "https://picsum.photos/id/56/1200/630",
    "created": "2025-10-22T10:24:16Z",
    "updated": "2025-07-25T02:20:12Z"
  },
  {
    "id": "5ed42e74-8733-4b7c-b765-fc577508543e",
    "name": "Ruotsin verbikertaus (pre-recorded)",
    "description": "Espanjan alkeet (pre-recorded). Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-07-26T20:07:15Z",
    "location": "https://teams.example.com/lesson-437",
    "service_provider": "Sami Lehtinen",
    "listing_creator": "Sara Hietala",
    "price": "€22",
    "service_type": "pre-recorded",
    "attendee_limit": "unlimited",
    "service_category": "language",
    "image": "https://picsum.photos/id/457/1200/630",
    "created": "2025-08-27T03:42:04Z",
    "updated": "2025-11-12T03:49:58Z"
  },
  {
    "id": "7806601a-06a3-4973-93f9-32a3ef7ebdb5",
    "name": "Akvarelli-workshop – muistikortit",
    "description": "Piirustuksen perusteet – muistikortit. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-05-19T02:04:59Z",
    "location": "https://teams.example.com/session-128",
    "service_provider": "Liisa Korhonen",
    "listing_creator": "Noora Salmi",
    "price": "€26",
    "service_type": "study material",
    "attendee_limit": "unlimited",
    "service_category": "art",
    "image": "https://picsum.photos/id/573/1200/630",
    "created": "2025-07-03T09:35:47Z",
    "updated": "2025-04-11T15:40:48Z"
  },
  {
    "id": "0e9d9298-8eb8-44e6-9d00-237e86ac68e2",
    "name": "Design systems – muistikortit",
    "description": "Design systems – muistikortit. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-02-01T06:40:11Z",
    "location": "https://zoom.example.com/session-332",
    "service_provider": "Liisa Korhonen",
    "listing_creator": "Janne Mäkinen",
    "price": "€58",
    "service_type": "study material",
    "attendee_limit": "unlimited",
    "service_category": "design",
    "image": "https://picsum.photos/id/963/1200/630",
    "created": "2025-03-18T09:26:03Z",
    "updated": "2025-05-12T03:56:29Z"
  },
  {
    "id": "a9aefc8b-0c0c-4259-8293-b1de4e41c329",
    "name": "1:1 Prototypointi",
    "description": "1:1 Käyttäjähaastattelut. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-11-21T03:29:26Z",
    "location": "https://teams.example.com/session-497",
    "service_provider": "Liisa Korhonen",
    "listing_creator": "Eero Järvinen",
    "price": "€53",
    "service_type": "1on1",
    "attendee_limit": "1",
    "service_category": "ux",
    "image": "https://picsum.photos/id/409/1200/630",
    "created": "2025-07-05T15:35:17Z",
    "updated": "2025-12-12T06:10:59Z"
  },
  {
    "id": "930d875a-4d73-42bc-8e19-7dc79b0f3be6",
    "name": "Hyllyn rakentaminen (pre-recorded)",
    "description": "Hyllyn rakentaminen (pre-recorded). Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-06-05T21:11:46Z",
    "location": "https://teams.example.com/session-842",
    "service_provider": "Jari Virtanen",
    "listing_creator": "Leo Pitkänen",
    "price": "Free",
    "service_type": "pre-recorded",
    "attendee_limit": "unlimited",
    "service_category": "woodworking",
    "image": "https://picsum.photos/id/326/1200/630",
    "created": "2025-03-08T00:32:56Z",
    "updated": "2025-02-19T08:05:00Z"
  },
  {
    "id": "96a99ef7-4f11-4abc-bc3e-07ecd8404d16",
    "name": "SQL-kyselyt – muistikortit",
    "description": "SQL-kyselyt – muistikortit. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-03-02T13:12:32Z",
    "location": "https://teams.example.com/lesson-234",
    "service_provider": "Aino Koskinen",
    "listing_creator": "Omar Rahman",
    "price": "€21",
    "service_type": "study material",
    "attendee_limit": "unlimited",
    "service_category": "data science",
    "image": "https://picsum.photos/id/44/1200/630",
    "created": "2025-01-06T12:45:13Z",
    "updated": "2025-11-07T10:32:50Z"
  },
  {
    "id": "c34fd77d-296f-45b5-8f90-4da6f865556a",
    "name": "Esiintymisvarmuus – muistikortit",
    "description": "Esiintymisvarmuus – muistikortit. Käytännönläheinen sessio harjoituksilla ja palautteella.",
    "datetime": "2025-04-08T19:16:14Z",
    "location": "https://zoom.example.com/workshop-613",
    "service_provider": "Ella Manninen",
    "listing_creator": "Omar Rahman",
    "price": "€24",
    "service_type": "study material",
    "attendee_limit": "unlimited",
    "service_category": "public speaking",
    "image": "https://picsum.photos/id/493/1200/630",
    "created": "2025-10-24T14:00:41Z",
    "updated": "2025-08-16T17:59:26Z"
  }
];

export const handlers = [
  // Health
  http.get("/mock/health", () => HttpResponse.json({ status: "ok" })),

  // Auth
  http.post("/mock/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    // Hyväksy mikä tahansa mockissa
    return HttpResponse.json({ token: "mock-jwt", email: body.email });
  }),

  // Users
  http.get("/mock/users", () => HttpResponse.json(users)),

  // Listed services
  http.get("/mock/listed_services", ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const category = (url.searchParams.get("category") || "").toLowerCase();
    const type = (url.searchParams.get("type") || "").toLowerCase();

    let out = services;
    if (q) {
      out = out.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.service_provider.toLowerCase().includes(q)
      );
    }
    if (category) out = out.filter((s) => s.service_category.toLowerCase() === category);
    if (type) out = out.filter((s) => s.service_type.toLowerCase() === type);

    return HttpResponse.json(out);
  }),

  http.get("/mock/listed_services/:id", ({ params }) => {
    const s = services.find((x) => x.id === params.id);
    if (!s) return new HttpResponse("Not found", { status: 404 });
    return HttpResponse.json(s);
  }),

  http.post("/mock/listed_services", async ({ request }) => {
    const body = (await request.json()) as ListedService;
    const now = new Date().toISOString();
    const newItem: ListedService = {
      ...body,
      id: crypto.randomUUID(),
      created: now,
      updated: now,
    };
    services.unshift(newItem);
    return HttpResponse.json(newItem, { status: 201 });
  }),

  http.put("/mock/listed_services/:id", async ({ params, request }) => {
    const idx = services.findIndex((x) => x.id === params.id);
    if (idx === -1) return new HttpResponse("Not found", { status: 404 });
    const body = (await request.json()) as Partial<ListedService>;
    services[idx] = { ...services[idx], ...body, updated: new Date().toISOString() };
    return HttpResponse.json(services[idx]);
  }),

  http.delete("/mock/listed_services/:id", ({ params }) => {
    const before = services.length;
    services = services.filter((x) => x.id !== params.id);
    if (services.length === before) return new HttpResponse("Not found", { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),
];
