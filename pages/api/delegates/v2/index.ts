/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { NextApiRequest, NextApiResponse } from 'next';
import { fetchDelegatesPaginated } from 'modules/delegates/api/fetchDelegates';
import { DelegatesPaginatedAPIResponse } from 'modules/delegates/types';
import { DEFAULT_NETWORK, SupportedNetworks } from 'modules/web3/constants/networks';
import {
  DelegateOrderByEnum,
  DelegateTypeEnum,
  OrderDirectionEnum
} from 'modules/delegates/delegates.constants';
import withApiHandler from 'modules/app/api/withApiHandler';
import validateQueryParam from 'modules/app/api/validateQueryParam';

/**
 * @swagger
 * paths:
 *   /api/delegates/v2:
 *     get:
 *       tags:
 *         - "delegates"
 *       description: Returns a paginated list of delegates according to the specified filters and sorting.
 *       produces:
 *         - "application/json"
 *       parameters:
 *         - name: network
 *           in: query
 *           description: The network to query the delegates for. Defaults to mainnet.
 *           schema:
 *             type: string
 *             enum: [goerli, goerlifork, mainnet]
 *           default: "mainnet"
 *         - name: pageSize
 *           in: query
 *           description: The number of delegates to return per page. Defaults to 20.
 *           schema:
 *             type: integer
 *             minimum: 1
 *             maximum: 30
 *           default: 20
 *         - name: page
 *           in: query
 *           description: The page number to return. Defaults to 1.
 *           schema:
 *             type: integer
 *             minimum: 1
 *           default: 1
 *         - name: includeExpired
 *           description: Whether to include expired delegates. Defaults to false.
 *           in: query
 *           schema:
 *             type: boolean
 *           default: false
 *         - name: orderBy
 *           description: The field to sort the delegates by. Defaults to DATE.
 *           in: query
 *           schema:
 *             type: string
 *             enum: [MKR, DELEGATORS, DATE, RANDOM]
 *           default: DATE
 *         - name: orderDirection
 *           description: The order direction for the sorting. Defaults to DESC.
 *           in: query
 *           schema:
 *             type: string
 *             enum: [ASC, DESC]
 *           default: DESC
 *         - name: seed
 *           description: The seed to use for the random ordering, only relevant when sorting delegates by RANDOM.
 *           in: query
 *           schema:
 *             type: number
 *             minimum: -1
 *             maximum: 1
 *         - name: delegateType
 *           description: The type of delegates to return. Defaults to ALL.
 *           in: query
 *           schema:
 *             type: string
 *             enum: [CONSTITUTIONAL, SHADOW, ALL]
 *           default: ALL
 *         - name: name
 *           description: The name of the constitutional delegate to return. Only applicable when delegateType is constitutional.
 *           in: query
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: A paginated list of delegates matching the specified filters and sorting.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/DelegatesPaginatedAPIResponse'
 * components:
 *   schemas:
 *     DelegatesAPIStats:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *         shadow:
 *           type: number
 *         constitutional:
 *           type: number
 *         totalMKRDelegated:
 *           type: string
 *         totalDelegators:
 *           type: number
 *     Tag:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         shortname:
 *           type: string
 *         longname:
 *           type: string
 *         description:
 *           type: string
 *         recommend_ui:
 *           type: boolean
 *         related_link:
 *           type: string
 *         precedence:
 *           type: integer
 *       required:
 *         - id
 *         - shortname
 *         - longname
 *     TagCount:
 *       allOf:
 *         - $ref: "#/components/schemas/Tag"
 *         - type: object
 *           properties:
 *             count:
 *               type: integer
 *           required:
 *             - count
 *     DelegateStatus:
 *       type: string
 *       enum:
 *         - constitutional
 *         - expired
 *         - shadow
 *     DelegatePaginated:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         voteDelegateAddress:
 *           type: string
 *         address:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/DelegateStatus'
 *         creationDate:
 *           type: string
 *           format: date-time
 *         expirationDate:
 *           type: string
 *           format: date-time
 *         expired:
 *           type: boolean
 *         isAboutToExpire:
 *           type: boolean
 *         picture:
 *           type: string
 *         communication:
 *           type: string
 *         combinedParticipation:
 *           type: string
 *         pollParticipation:
 *           type: string
 *         executiveParticipation:
 *           type: string
 *         cuMember:
 *           type: boolean
 *         mkrDelegated:
 *           type: string
 *         delegatorCount:
 *           type: number
 *         lastVoteDate:
 *           type: string
 *           format: date-time
 *         proposalsSupported:
 *           type: number
 *         execSupported:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             address:
 *               type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         previous:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *             voteDelegateAddress:
 *               type: string
 *         next:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *             voteDelegateAddress:
 *               type: string
 *       required:
 *         - name
 *         - voteDelegateAddress
 *         - address
 *         - status
 *         - creationDate
 *         - expirationDate
 *         - expired
 *         - isAboutToExpire
 *         - mkrDelegated
 *         - delegatorCount
 *         - proposalsSupported
 *         - tags
 *     DelegatesPaginatedAPIResponse:
 *       type: object
 *       properties:
 *         paginationInfo:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *             page:
 *               type: number
 *             numPages:
 *               type: number
 *             hasNextPage:
 *               type: boolean
 *         stats:
 *           $ref: '#/components/schemas/DelegatesAPIStats'
 *         delegates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DelegatePaginated'
 *         tags:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TagCount'
 */

export default withApiHandler(
  async (req: NextApiRequest, res: NextApiResponse<DelegatesPaginatedAPIResponse>) => {
    const network = validateQueryParam(req.query.network, 'string', {
      defaultValue: DEFAULT_NETWORK.network,
      validValues: [SupportedNetworks.GOERLI, SupportedNetworks.GOERLIFORK, SupportedNetworks.MAINNET]
    }) as SupportedNetworks;

    const pageSize = validateQueryParam(req.query.pageSize, 'number', {
      defaultValue: 20,
      minValue: 1,
      maxValue: 30
    }) as number;

    const page = validateQueryParam(req.query.page, 'number', {
      defaultValue: 1,
      minValue: 1
    }) as number;

    const includeExpired = validateQueryParam(req.query.includeExpired, 'boolean', {
      defaultValue: false
    }) as boolean;

    const orderBy = validateQueryParam(req.query.orderBy, 'string', {
      defaultValue: DelegateOrderByEnum.DATE,
      validValues: [
        DelegateOrderByEnum.MKR,
        DelegateOrderByEnum.DELEGATORS,
        DelegateOrderByEnum.DATE,
        DelegateOrderByEnum.RANDOM
      ]
    }) as string;

    const orderDirection = validateQueryParam(req.query.orderDirection, 'string', {
      defaultValue: OrderDirectionEnum.DESC,
      validValues: [OrderDirectionEnum.ASC, OrderDirectionEnum.DESC]
    }) as string;

    const seed = validateQueryParam(req.query.seed, 'float', {
      defaultValue: null,
      minValue: -1,
      maxValue: 1
    }) as number | null;

    const delegateType = validateQueryParam(req.query.delegateType, 'string', {
      defaultValue: DelegateTypeEnum.ALL,
      validValues: [DelegateTypeEnum.CONSTITUTIONAL, DelegateTypeEnum.SHADOW, DelegateTypeEnum.ALL]
    }) as DelegateTypeEnum;

    const name =
      delegateType !== DelegateTypeEnum.CONSTITUTIONAL
        ? null
        : (validateQueryParam(req.query.name, 'string', {
            defaultValue: null
          }) as string | null);

    const cvcs =
      delegateType !== DelegateTypeEnum.CONSTITUTIONAL
        ? null
        : (validateQueryParam(req.query.cvcs, 'array', {
            defaultValue: null
          }) as string[] | null);

    const delegates = await fetchDelegatesPaginated({
      network,
      pageSize,
      page,
      includeExpired,
      orderBy,
      orderDirection,
      seed,
      delegateType,
      name,
      cvcs
    });

    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate');
    res.status(200).json(delegates);
  }
);
