import {HomeIcon} from '@sanity/icons'
import React from 'react'
import {defineArrayMember, defineField, defineType} from 'sanity'

const stayTypes = [
  {title: 'Cabin', value: 'cabin'},
  {title: 'Beach', value: 'beach'},
  {title: 'City', value: 'city'},
  {title: 'Villa', value: 'villa'},
]

const amenities = [
  {title: 'Hot tub', value: 'hotTub'},
  {title: 'Pool', value: 'pool'},
  {title: 'Fireplace', value: 'fireplace'},
  {title: 'Fire pit', value: 'firePit'},
  {title: 'Sauna', value: 'sauna'},
  {title: 'Wi-Fi', value: 'wifi'},
  {title: 'Kitchen', value: 'kitchen'},
  {title: 'Workspace', value: 'workspace'},
  {title: 'Parking', value: 'parking'},
  {title: 'Washer', value: 'washer'},
  {title: 'Air conditioning', value: 'ac'},
  {title: 'Ocean view', value: 'oceanView'},
  {title: 'Lake view', value: 'lakeView'},
  {title: 'Beach access', value: 'beachAccess'},
  {title: 'Mountain view', value: 'mountainView'},
  {title: 'Barbecue', value: 'bbq'},
  {title: 'EV charger', value: 'evCharger'},
  {title: 'Bikes', value: 'bikes'},
  {title: 'Heating', value: 'heating'},
]

export const property = defineType({
  name: 'property',
  title: 'Stay',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'place', title: 'Place'},
    {name: 'layout', title: 'Capacity and layout'},
    {name: 'price', title: 'Price'},
    {name: 'rules', title: 'Rules'},
    {name: 'copy', title: 'Description'},
    {name: 'media', title: 'Photos and host'},
    {name: 'reviews', title: 'Reviews'},
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'basics',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'basics',
      options: {source: 'title', maxLength: 80},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Stay type',
      type: 'string',
      group: 'basics',
      options: {list: stayTypes, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'city',
      type: 'string',
      group: 'place',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'region', type: 'string', group: 'place'}),
    defineField({
      name: 'country',
      type: 'string',
      group: 'place',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'neighborhood', type: 'string', group: 'place'}),
    defineField({name: 'location', type: 'geopoint', group: 'place'}),
    defineField({
      name: 'maxGuests',
      title: 'Guests',
      type: 'number',
      group: 'layout',
      validation: (rule) => rule.required().integer().min(1).max(30),
    }),
    defineField({
      name: 'bedrooms',
      type: 'number',
      group: 'layout',
      validation: (rule) => rule.required().integer().min(0).max(30),
    }),
    defineField({
      name: 'beds',
      type: 'number',
      group: 'layout',
      validation: (rule) => rule.required().integer().min(1).max(50),
    }),
    defineField({
      name: 'bathrooms',
      type: 'number',
      group: 'layout',
      validation: (rule) => rule.required().min(0.5).max(30),
    }),
    defineField({
      name: 'pricePerNight',
      title: 'Price per night (USD)',
      type: 'number',
      group: 'price',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'cleaningFee',
      title: 'Cleaning fee (USD)',
      type: 'number',
      group: 'price',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'weeklyDiscountPercent',
      type: 'number',
      group: 'price',
      validation: (rule) => rule.min(0).max(50),
    }),
    defineField({
      name: 'minNights',
      type: 'number',
      group: 'price',
      validation: (rule) => rule.required().integer().min(1).max(90),
    }),
    defineField({
      name: 'amenities',
      type: 'array',
      group: 'basics',
      of: [defineArrayMember({type: 'string'})],
      options: {list: amenities},
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'quiet',
      title: 'Quiet stay',
      type: 'boolean',
      group: 'basics',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'houseRules',
      type: 'object',
      group: 'rules',
      fields: [
        defineField({name: 'checkInTime', type: 'string', validation: (rule) => rule.required()}),
        defineField({name: 'checkOutTime', type: 'string', validation: (rule) => rule.required()}),
        defineField({name: 'quietHoursFrom', type: 'string'}),
        defineField({name: 'quietHoursTo', type: 'string'}),
        defineField({
          name: 'petsAllowed',
          type: 'boolean',
          validation: (rule) => rule.required(),
        }),
        defineField({name: 'maxPets', type: 'number', validation: (rule) => rule.integer().min(0)}),
        defineField({name: 'petFee', type: 'number', validation: (rule) => rule.min(0)}),
        defineField({name: 'smokingAllowed', type: 'boolean'}),
        defineField({name: 'partiesAllowed', type: 'boolean'}),
        defineField({
          name: 'additionalRules',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
        }),
      ],
    }),
    defineField({
      name: 'summary',
      type: 'string',
      group: 'copy',
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 6,
      group: 'copy',
      validation: (rule) => rule.required().min(40).max(1200),
    }),
    defineField({
      name: 'highlights',
      type: 'array',
      group: 'copy',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: 'vibes',
      title: 'Descriptive tags',
      type: 'array',
      group: 'copy',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'facts',
      title: 'Verified stay facts',
      type: 'array',
      group: 'copy',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'copyReview',
      title: 'Copy review',
      type: 'object',
      group: 'copy',
      readOnly: true,
      fields: [
        defineField({
          name: 'status',
          type: 'string',
          options: {list: ['passed', 'failed']},
        }),
        defineField({name: 'checkedAt', type: 'datetime'}),
        defineField({name: 'sourceHash', type: 'string'}),
        defineField({
          name: 'unsupportedClaims',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({name: 'claim', type: 'string'}),
                defineField({name: 'reason', type: 'string'}),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'photos',
      type: 'array',
      group: 'media',
      of: [defineArrayMember({type: 'stayPhoto'})],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'host',
      type: 'reference',
      group: 'media',
      to: [{type: 'host'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cancellationPolicy',
      title: 'Cancellation policy',
      type: 'reference',
      group: 'rules',
      to: [{type: 'policy'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'policies',
      title: 'Shared property policies',
      type: 'array',
      group: 'rules',
      of: [defineArrayMember({type: 'reference', to: [{type: 'policy'}]})],
    }),
    defineField({
      name: 'rating',
      type: 'number',
      group: 'reviews',
      validation: (rule) => rule.required().min(0).max(5),
    }),
    defineField({
      name: 'reviewCount',
      type: 'number',
      group: 'reviews',
      validation: (rule) => rule.required().integer().min(0),
    }),
  ],
  preview: {
    select: {title: 'title', city: 'city', price: 'pricePerNight', imageUrl: 'photos.0.url'},
    prepare({title, city, price, imageUrl}) {
      return {
        title,
        subtitle: [city, typeof price === 'number' ? `$${price}/night` : undefined]
          .filter(Boolean)
          .join(' · '),
        media: imageUrl
          ? () =>
              React.createElement('img', {
                src: imageUrl,
                alt: title || '',
                style: {width: '100%', height: '100%', objectFit: 'cover'},
              })
          : HomeIcon,
      }
    },
  },
})
