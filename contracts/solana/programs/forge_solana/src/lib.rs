use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, TokenAccount, Transfer};
use spl_token::instruction::AuthorityType;

declare_id!("ForgeYourTokenProgramId11111111");

#[program]
pub mod forge_solana {
    use super::*;

    /// Create a new token with custom specifications
    pub fn create_token(
        ctx: Context<CreateToken>,
        name: String,
        symbol: String,
        decimals: u8,
        initial_supply: u64,
    ) -> Result<()> {
        require!(decimals <= 9, CustomError::InvalidDecimals);
        require!(name.len() <= 32, CustomError::NameTooLong);
        require!(symbol.len() <= 10, CustomError::SymbolTooLong);

        let token_config = &mut ctx.accounts.token_config;
        token_config.mint = ctx.accounts.mint.key();
        token_config.owner = ctx.accounts.payer.key();
        token_config.name = name;
        token_config.symbol = symbol;
        token_config.decimals;
        token_config.total_supply = initial_supply;
        token_config.created_at = Clock::get()?.unix_timestamp;

        // Mint initial supply to owner's token account
        if initial_supply > 0 {
            token::mint_to(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    MintTo {
                        mint: ctx.accounts.mint.to_account_info(),
                        to: ctx.accounts.owner_token_account.to_account_info(),
                        authority: ctx.accounts.payer.to_account_info(),
                    },
                ),
                initial_supply,
            )?;
        }

        emit!(TokenCreated {
            mint: ctx.accounts.mint.key(),
            owner: ctx.accounts.payer.key(),
            name: token_config.name.clone(),
            symbol: token_config.symbol.clone(),
            decimals: token_config.decimals,
            initial_supply,
        });

        Ok(())
    }

    /// Mint additional tokens
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        // Verify caller is the token owner
        require!(
            token_config.owner == ctx.accounts.payer.key(),
            CustomError::Unauthorized
        );

        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            amount,
        )?;

        token_config.total_supply = token_config.total_supply.checked_add(amount)
            .ok_or(CustomError::Overflow)?;

        emit!(TokensMinted {
            mint: ctx.accounts.mint.key(),
            amount,
            to: ctx.accounts.token_account.key(),
        });

        Ok(())
    }

    /// Burn tokens
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            amount,
        )?;

        token_config.total_supply = token_config.total_supply.checked_sub(amount)
            .ok_or(CustomError::Underflow)?;

        emit!(TokensBurned {
            mint: ctx.accounts.mint.key(),
            amount,
        });

        Ok(())
    }
}

// Account contexts
#[derive(Accounts)]
#[instruction(name: String, symbol: String)]
pub struct CreateToken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init, payer = payer, space = 8 + TokenConfig::LEN)]
    pub token_config: Account<'info, TokenConfig>,

    #[account(init, payer = payer, mint::decimals = 9, mint::authority = payer)]
    pub mint: Account<'info, Mint>,

    #[account(init, payer = payer, token::mint = mint, token::authority = payer)]
    pub owner_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub token_config: Account<'info, TokenConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, token::Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub token_config: Account<'info, TokenConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, token::Token>,
}

// State
#[account]
pub struct TokenConfig {
    pub mint: Pubkey,
    pub owner: Pubkey,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u64,
    pub created_at: i64,
}

impl TokenConfig {
    const LEN: usize = 32 + 32 + (4 + 32) + (4 + 10) + 1 + 8 + 8;
}

// Events
#[event]
pub struct TokenCreated {
    pub mint: Pubkey,
    pub owner: Pubkey,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub initial_supply: u64,
}

#[event]
pub struct TokensMinted {
    pub mint: Pubkey,
    pub amount: u64,
    pub to: Pubkey,
}

#[event]
pub struct TokensBurned {
    pub mint: Pubkey,
    pub amount: u64,
}

// Errors
#[error_code]
pub enum CustomError {
    #[msg("Invalid decimals value")]
    InvalidDecimals,
    #[msg("Token name too long")]
    NameTooLong,
    #[msg("Token symbol too long")]
    SymbolTooLong,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Overflow")]
    Overflow,
    #[msg("Underflow")]
    Underflow,
}
